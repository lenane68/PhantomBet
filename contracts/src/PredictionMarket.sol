// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./Utils.sol";

/**
 * @title PredictionMarket
 * @dev A privacy-first prediction market using commitment-reveal scheme.
 *      Integrated with Chainlink Runtime Environment (CRE) for AI-powered settlement.
 */
contract PredictionMarket is Ownable, ReentrancyGuard {
    uint256 public nextMarketId;
    address public oracleAddress; // CRESettlementOracle address

    mapping(uint256 => Utils.Market) public markets;
    // MarketId -> User -> Bets
    mapping(uint256 => mapping(address => Utils.Bet[])) public bets;

    modifier onlyOracle() {
        if (msg.sender != oracleAddress) revert Utils.Unauthorized();
        _;
    }

    modifier beforeDeadline(uint256 marketId) {
        if (block.timestamp >= markets[marketId].bettingDeadline)
            revert Utils.BettingPhaseClosed();
        _;
    }

    modifier duringRevealPhase(uint256 marketId) {
        if (block.timestamp < markets[marketId].bettingDeadline)
            revert Utils.BettingPhaseActive();
        if (block.timestamp >= markets[marketId].revealDeadline)
            revert Utils.RevealPhaseClosed();
        _;
    }

    modifier afterRevealPhase(uint256 marketId) {
        if (block.timestamp < markets[marketId].revealDeadline)
            revert Utils.RevealPhaseActive();
        _;
    }

    constructor(address _oracleAddress) Ownable(msg.sender) {
        oracleAddress = _oracleAddress;
    }

    /**
     * @notice Creates a new prediction market.
     * @param question The question to be predicted (e.g., "Will ETH hit $5k?").
     * @param outcomes List of possible outcomes (e.g., ["Yes", "No"]).
     * @param duration Duration of the betting phase in seconds.
     * @param revealDuration Duration of the reveal phase in seconds.
     */
    function createMarket(
        string calldata question,
        string[] calldata outcomes,
        uint256 duration,
        uint256 revealDuration
    ) external onlyOwner {
        if (duration == 0) revert Utils.InvalidBettingDeadline();
        if (outcomes.length <= 1) revert Utils.InvalidOutcomeCount();

        uint256 marketId = nextMarketId++;
        Utils.Market storage market = markets[marketId];

        market.id = marketId;
        market.question = question;
        market.outcomes = outcomes;
        market.bettingDeadline = block.timestamp + duration;
        market.revealDeadline = market.bettingDeadline + revealDuration;
        market.settled = false;

        emit Utils.MarketCreated(marketId, question, market.bettingDeadline);
    }

    /**
     * @notice Places a privacy-preserving bet using a commitment.
     * @param marketId The ID of the market to bet on.
     * @param commitment The hash of the bet details: keccak256(amount + outcomeString + secret).
     */
    function placeBet(
        uint256 marketId,
        bytes32 commitment
    ) external payable nonReentrant beforeDeadline(marketId) {
        if (msg.value == 0) revert Utils.InvalidAmount();

        bets[marketId][msg.sender].push(
            Utils.Bet({
                commitment: commitment,
                amount: msg.value,
                revealed: false,
                revealedOutcomeId: 0,
                bettor: msg.sender
            })
        );

        markets[marketId].totalPool += msg.value;

        emit Utils.BetPlaced(marketId, msg.sender, commitment, msg.value);
    }

    /**
     * @notice Reveals a previously placed bet.
     * @param marketId The ID of the market.
     * @param outcomeIndex The index of the outcome in the market's outcomes array.
     * @param secret The secret used to generate the commitment.
     * @param betIndex The index of the bet in the user's bet array.
     */
    function revealBet(
        uint256 marketId,
        uint256 outcomeIndex,
        string calldata secret,
        uint256 betIndex
    ) external nonReentrant duringRevealPhase(marketId) {
        if (betIndex >= bets[marketId][msg.sender].length)
            revert Utils.InvalidReveal();
        Utils.Bet storage bet = bets[marketId][msg.sender][betIndex];
        if (bet.revealed) revert Utils.AlreadyRevealed();

        // Verify outcome index
        if (outcomeIndex >= markets[marketId].outcomes.length)
            revert Utils.InvalidOutcome();
        string memory outcomeStr = markets[marketId].outcomes[outcomeIndex];

        // Verify commitment
        bytes32 verifyHash = keccak256(
            abi.encodePacked(bet.amount, outcomeStr, secret)
        );
        if (verifyHash != bet.commitment) revert Utils.InvalidCommitment();

        bet.revealed = true;
        bet.revealedOutcomeId = outcomeIndex;
        markets[marketId].outcomePools[outcomeIndex] += bet.amount;

        emit Utils.BetRevealed(marketId, msg.sender, outcomeStr, bet.amount);
    }

    /**
     * @notice Settles the market with the final outcome. Only callable by the CRE Oracle.
     * @param marketId The ID of the market.
     * @param outcome The verified outcome string.
     */
    function settleMarket(
        uint256 marketId,
        string calldata outcome
    ) external onlyOracle afterRevealPhase(marketId) {
        Utils.Market storage market = markets[marketId];
        if (market.settled) revert Utils.AlreadySettled();

        // Find outcome index
        bool found = false;
        uint256 outcomeIndex;
        for (uint256 i = 0; i < market.outcomes.length; i++) {
            if (
                keccak256(bytes(market.outcomes[i])) ==
                keccak256(bytes(outcome))
            ) {
                outcomeIndex = i;
                found = true;
                break;
            }
        }
        if (!found) revert Utils.InvalidOutcome();

        market.finalOutcomeId = outcomeIndex;
        market.settled = true;

        emit Utils.MarketSettled(marketId, outcome);
    }

    /**
     * @notice Claims winnings for a settled market.
     * @param marketId The ID of the market.
     */
    function claimWinnings(uint256 marketId) external nonReentrant {
        Utils.Market storage market = markets[marketId];
        if (!market.settled) revert Utils.MarketNotSettled();

        uint256 payout = 0;
        uint256 totalWinningPool = market.outcomePools[market.finalOutcomeId];

        // If nobody won (e.g., all bets were on wrong outcome), the pot is locked
        if (totalWinningPool == 0) revert Utils.NoWinners();

        Utils.Bet[] storage userBets = bets[marketId][msg.sender];
        for (uint i = 0; i < userBets.length; i++) {
            Utils.Bet storage bet = userBets[i];

            // Check if bet was revealed AND matched the final outcome
            if (
                bet.revealed && bet.revealedOutcomeId == market.finalOutcomeId
            ) {
                // Calculate share: (UserBetAmount * TotalPool) / TotalWinningPool
                uint256 share = (bet.amount * market.totalPool) /
                    totalWinningPool;
                payout += share;

                // Prevent re-claiming: Mark as already processed
                bet.amount = 0;
            }
        }

        if (payout == 0) revert Utils.NoWinnings();

        (bool success, ) = payable(msg.sender).call{value: payout}("");
        if (!success) revert Utils.TransferFailed();

        emit Utils.WinningsClaimed(marketId, msg.sender, payout);
    }

    /**
     * @notice Update Oracle Address
     */
    function setOracle(address _oracle) external onlyOwner {
        oracleAddress = _oracle;
    }

    /**
     * @notice Returns the outcomes for a given market.
     * @param marketId The ID of the market.
     */
    function getMarketOutcomes(
        uint256 marketId
    ) external view returns (string[] memory) {
        return markets[marketId].outcomes;
    }
}
