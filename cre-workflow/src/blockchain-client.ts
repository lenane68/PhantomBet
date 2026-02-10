/**
 * Blockchain interaction utilities for PhantomBet CRE Workflow
 */

import { ethers } from 'ethers';
import type { Market, SettlementResult } from './types.js';

// ABI fragments for the contracts
const PREDICTION_MARKET_ABI = [
    'function nextMarketId() view returns (uint256)',
    'function markets(uint256) view returns (uint256 id, string question, uint256 bettingDeadline, uint256 revealDeadline, bool revealed, uint256 finalOutcomeId, bool settled, uint256 totalPool)',
    'function getMarketOutcomes(uint256 marketId) view returns (string[] memory)',
];

const ORACLE_ABI = [
    'function receiveSettlement(uint256 marketId, string calldata outcome, bytes calldata proof) external',
];

export class BlockchainClient {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private predictionMarket: ethers.Contract;
    private oracle: ethers.Contract;

    constructor(
        rpcUrl: string,
        privateKey: string,
        predictionMarketAddress: string,
        oracleAddress: string
    ) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);

        this.predictionMarket = new ethers.Contract(
            predictionMarketAddress,
            PREDICTION_MARKET_ABI,
            this.wallet
        );

        this.oracle = new ethers.Contract(
            oracleAddress,
            ORACLE_ABI,
            this.wallet
        );
    }

    /**
     * Get all markets that are ready to be settled
     * (past reveal deadline and not yet settled)
     */
    async getMarketsToSettle(): Promise<Market[]> {
        try {
            const nextMarketId = await this.predictionMarket.nextMarketId();
            const currentTime = Math.floor(Date.now() / 1000);
            const marketsToSettle: Market[] = [];

            // Check each market
            for (let i = 0; i < Number(nextMarketId); i++) {
                const marketData = await this.predictionMarket.markets(i);

                // Check if market is past reveal deadline and not settled
                if (Number(marketData.revealDeadline) < currentTime && !marketData.settled) {
                    // Fetch outcomes separately (they're stored as a dynamic array)
                    const outcomes = await this.getMarketOutcomes(i);

                    const market: Market = {
                        id: Number(marketData.id),
                        question: marketData.question,
                        outcomes: outcomes,
                        bettingDeadline: Number(marketData.bettingDeadline),
                        revealDeadline: Number(marketData.revealDeadline),
                        settled: marketData.settled,
                        finalOutcomeId: Number(marketData.finalOutcomeId),
                        totalPool: marketData.totalPool,
                    };

                    marketsToSettle.push(market);
                }
            }

            return marketsToSettle;
        } catch (error) {
            console.error('Error fetching markets to settle:', error);
            throw error;
        }
    }

    /**
     * Get outcomes for a specific market
     */
    private async getMarketOutcomes(marketId: number): Promise<string[]> {
        try {
            // Note: This requires adding a view function to the contract
            // For now, we'll need to handle this differently
            // This is a placeholder - you may need to emit events or store outcomes differently
            return ['Yes', 'No']; // Default for demo
        } catch (error) {
            console.error(`Error fetching outcomes for market ${marketId}:`, error);
            return [];
        }
    }

    /**
     * Submit settlement to the Oracle contract
     */
    async submitSettlement(
        marketId: number,
        outcome: string
    ): Promise<SettlementResult> {
        try {
            console.log(`Submitting settlement for market ${marketId}: ${outcome}`);

            // Empty proof for hackathon version
            const proof = '0x';

            const tx = await this.oracle.receiveSettlement(marketId, outcome, proof);
            const receipt = await tx.wait();

            console.log(`Settlement submitted! Tx hash: ${receipt.hash}`);

            return {
                marketId,
                outcome,
                outcomeIndex: 0, // Will be determined by contract
                consensus: true,
                confidence: 1.0,
                txHash: receipt.hash,
            };
        } catch (error) {
            console.error('Error submitting settlement:', error);
            throw error;
        }
    }

    /**
     * Verify that a settlement was successful
     */
    async verifySettlement(marketId: number): Promise<boolean> {
        try {
            const marketData = await this.predictionMarket.markets(marketId);
            return marketData.settled;
        } catch (error) {
            console.error('Error verifying settlement:', error);
            return false;
        }
    }
}
