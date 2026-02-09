// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

library Utils {
    error Unauthorized(); // Sender is not authorized (e.g. not Oracle)
    error InvalidMarketId();
    error InvalidOutcome(); // Outcome choice doesn't exist or is invalid
    error InvalidOutcomeCount(); // Not enough outcomes provided
    error InvalidAmount(); // 0 amount or insufficient balance
    error InvalidBettingDeadline(); // Deadline logic fail
    error InvalidRevealDeadline();

    // Betting/Reveal State Errors
    error BettingPhaseClosed();
    error BettingPhaseActive();
    error RevealPhaseClosed();
    error RevealPhaseActive();

    // Reveal Specific
    error InvalidReveal();
    error AlreadyRevealed();
    error InvalidCommitment();

    // Settlement/Claiming
    error InvalidSettlement(); // General settlement error
    error AlreadySettled();
    error MarketNotSettled();

    error InvalidWinningsClaim(); // General claim error
    error NoWinners();
    error NoWinnings();

    error TransferFailed();
    error InvalidAddress();

    // --- Events ---

    event SettlementReceived(
        uint256 indexed marketId,
        string outcome,
        address indexed node
    );
    event NodeAuthorized(address indexed node, bool authorized);
    event MarketAddressUpdated(address indexed newMarket);

    event MarketCreated(
        uint256 indexed marketId,
        string question,
        uint256 bettingDeadline
    );
    event BetPlaced(
        uint256 indexed marketId,
        address indexed bettor,
        bytes32 commitment,
        uint256 amount
    );
    event BetRevealed(
        uint256 indexed marketId,
        address indexed bettor,
        string outcome,
        uint256 amount
    );
    event MarketSettled(uint256 indexed marketId, string outcome);
    event WinningsClaimed(
        uint256 indexed marketId,
        address indexed bettor,
        uint256 amount
    );

    // --- Structs ---

    struct Market {
        uint256 id;
        string question;
        string[] outcomes; // Possible outcomes (e.g., ["Yes", "No"])
        uint256 bettingDeadline;
        uint256 revealDeadline;
        bool revealed;
        uint256 finalOutcomeId; // Set by Oracle (Index in outcomes array)
        bool settled;
        uint256 totalPool;
        mapping(uint256 => uint256) outcomePools; // OutcomeIndex -> Total Amount Bet
    }

    struct Bet {
        bytes32 commitment; // keccak256(abi.encodePacked(amount, outcomeString, secret))
        uint256 amount;
        bool revealed;
        uint256 revealedOutcomeId;
        address bettor;
    }
}
