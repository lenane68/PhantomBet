// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PredictionMarket.sol";
import "./Utils.sol";

/**
 * @title CRESettlementOracle
 * @dev Receives verified outcomes from the Chainlink Runtime Environment (CRE) workflow
 *      and triggers settlement on the PredictionMarket contract.
 */
contract CRESettlementOracle is Ownable {
    PredictionMarket public predictionMarket;

    // Addresses allowed to submit settlements (CRE nodes)
    mapping(address => bool) public authorizedNodes;

    modifier onlyAuthorizedNode() {
        if (!authorizedNodes[msg.sender] && msg.sender != owner())
            revert Utils.Unauthorized();
        _;
    }

    constructor(address _predictionMarket) Ownable(msg.sender) {
        predictionMarket = PredictionMarket(_predictionMarket);
    }

    /**
     * @notice Receives settlement data from CRE workflow.
     * @param marketId The ID of the market to settle.
     * @param outcome The verified final outcome.
     * @param proof Optional proof data (e.g., signature) for additional verification.
     */
    function receiveSettlement(
        uint256 marketId,
        string calldata outcome,
        bytes calldata proof //not implemented for this version
    ) external onlyAuthorizedNode {
        // In a production CRE setup, 'proof' could be a cryptographic proof of consensus.
        // For this hackathon version, we rely on the security of the authorized node list (the CRE workflow runner).

        predictionMarket.settleMarket(marketId, outcome);

        emit Utils.SettlementReceived(marketId, outcome, msg.sender);
    }

    /**
     * @notice Updates the PredictionMarket contract address.
     */
    function updatePredictionMarket(address _newMarket) external onlyOwner {
        if (_newMarket == address(0)) revert Utils.InvalidAddress();
        predictionMarket = PredictionMarket(_newMarket);
        emit Utils.MarketAddressUpdated(_newMarket);
    }

    /**
     * @notice Authorizes or deauthorizes a CRE node address.
     * @param node The address of the CRE node wallet.
     * @param authorized True to authorize, false to revoke.
     */
    function determineNodeAuth(
        address node,
        bool authorized
    ) external onlyOwner {
        authorizedNodes[node] = authorized;
        emit Utils.NodeAuthorized(node, authorized);
    }
}
