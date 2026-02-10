/**
 * PhantomBet CRE Settlement Workflow
 * 
 * This workflow:
 * 1. Checks for markets ready to settle
 * 2. Gathers data from multiple sources
 * 3. Uses GPT-4 to analyze and determine outcome
 * 4. Submits settlement to blockchain
 */

import * as dotenv from 'dotenv';
import { BlockchainClient } from './blockchain-client.js';
import { DataSourceClient } from './data-sources.js';
import { AIAnalyzer } from './ai-analyzer.js';
import type { Market, SettlementResult } from './types.js';

// Load environment variables
dotenv.config({ path: '../.env' });

// Configuration
const CONFIG = {
    rpcUrl: process.env.ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc',
    privateKey: process.env.PRIVATE_KEY || '',
    predictionMarketAddress: process.env.PREDICTION_MARKET_ADDRESS || '',
    oracleAddress: process.env.CRE_ORACLE_ADDRESS || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    newsApiKey: process.env.NEWS_API_KEY || '',
    sportsDataApiKey: process.env.SPORTSDATA_API_KEY || '',
    minimumSources: 1, // For hackathon demo
    confidenceThreshold: 0.7,
};

/**
 * Main settlement workflow
 */
export async function settlementWorkflow(): Promise<void> {
    console.log('🚀 Starting PhantomBet Settlement Workflow...\n');

    try {
        // Validate configuration
        validateConfig();

        // Initialize clients
        const blockchainClient = new BlockchainClient(
            CONFIG.rpcUrl,
            CONFIG.privateKey,
            CONFIG.predictionMarketAddress,
            CONFIG.oracleAddress
        );

        const dataSourceClient = new DataSourceClient(
            CONFIG.newsApiKey,
            CONFIG.sportsDataApiKey
        );

        const aiAnalyzer = new AIAnalyzer(CONFIG.openaiApiKey);

        // Step 1: Get markets ready to settle
        console.log('📊 Checking for markets to settle...');
        const markets = await blockchainClient.getMarketsToSettle();

        if (markets.length === 0) {
            console.log('✅ No markets ready for settlement at this time.\n');
            return;
        }

        console.log(`Found ${markets.length} market(s) ready for settlement:\n`);

        // Step 2: Process each market
        for (const market of markets) {
            await processMarket(market, dataSourceClient, aiAnalyzer, blockchainClient);
        }

        console.log('\n✅ Settlement workflow completed successfully!');
    } catch (error) {
        console.error('❌ Error in settlement workflow:', error);
        throw error;
    }
}

/**
 * Process a single market
 */
async function processMarket(
    market: Market,
    dataSourceClient: DataSourceClient,
    aiAnalyzer: AIAnalyzer,
    blockchainClient: BlockchainClient
): Promise<SettlementResult | null> {
    console.log(`\n📝 Processing Market #${market.id}`);
    console.log(`   Question: ${market.question}`);
    console.log(`   Outcomes: ${market.outcomes.join(', ')}`);

    try {
        // Step 1: Gather data from sources
        console.log('   🔍 Gathering data from sources...');
        const dataSources = await dataSourceClient.aggregateData(market.question);
        console.log(`   ✓ Collected data from ${dataSources.length} source(s)`);

        if (dataSources.length === 0) {
            console.log('   ⚠️  No data sources available, skipping market');
            return null;
        }

        // Step 2: AI Analysis
        console.log('   🤖 Analyzing with GPT-4...');
        const aiResult = await aiAnalyzer.analyzeOutcome(
            market.question,
            market.outcomes,
            dataSources
        );
        console.log(`   ✓ AI Result: ${aiResult.outcome} (confidence: ${aiResult.confidence})`);
        console.log(`   ✓ Reasoning: ${aiResult.reasoning}`);

        // Step 3: Validate consensus
        console.log('   ✅ Validating consensus...');
        const consensus = aiAnalyzer.validateConsensus(
            aiResult,
            dataSources,
            CONFIG.minimumSources,
            CONFIG.confidenceThreshold
        );

        if (!consensus || consensus.confidence < CONFIG.confidenceThreshold) {
            console.log(`   ⚠️  Confidence too low (${consensus.confidence}), skipping settlement`);
            return null;
        }

        console.log(`   ✓ Consensus achieved: ${consensus.agreedOutcome}`);

        // Step 4: Submit settlement
        console.log('   📤 Submitting settlement to blockchain...');
        const result = await blockchainClient.submitSettlement(
            market.id,
            consensus.agreedOutcome
        );
        console.log(`   ✅ Settlement submitted! Tx: ${result.txHash}`);

        // Step 5: Verify
        const verified = await blockchainClient.verifySettlement(market.id);
        if (verified) {
            console.log('   ✅ Settlement verified on-chain!');
        }

        return result;
    } catch (error) {
        console.error(`   ❌ Error processing market #${market.id}:`, error);
        return null;
    }
}

/**
 * Validate configuration
 */
function validateConfig(): void {
    const required = [
        'privateKey',
        'predictionMarketAddress',
        'oracleAddress',
        'openaiApiKey',
        'newsApiKey',
    ];

    const missing = required.filter(key => !CONFIG[key as keyof typeof CONFIG]);

    if (missing.length > 0) {
        throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }
}

/**
 * Run the workflow (for standalone execution)
 */
if (import.meta.url === `file://${process.argv[1]}`) {
    settlementWorkflow()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}
