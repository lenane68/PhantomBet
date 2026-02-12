import {
  CronCapability,
  handler,
  Runner,
  prepareReportRequest,
  type Runtime,
} from "@chainlink/cre-sdk";
import { BlockchainClient } from "./src/blockchain-client.js";
import { DataSourceClient } from "./src/data-sources.js";
import { AIAnalyzer } from "./src/ai-analyzer.js";

type Config = {
  schedule: string;
  monadRpcUrl: string;
  marketContractAddress: string;
  oracleContractAddress: string;
  coinGeckoApiUrl: string;
  openAiApiKey?: string;
  newsApiKey?: string;
};

// Main workflow callback
const onCronTrigger = async (runtime: Runtime<Config>) => {
  const config = runtime.config;

  // Initialize modular clients
  const blockchain = new BlockchainClient(); // Uses default Monad Testnet selector
  const dataSources = new DataSourceClient();
  const ai = new AIAnalyzer();

  runtime.log("🔍 [PhantomBet DON] Polling for markets ready to settle...");

  try {
    // 1. Discover markets
    const markets = await blockchain.getMarketsToSettle(runtime, config.marketContractAddress);

    if (markets.length === 0) {
      runtime.log("✅ No markets ready for settlement.");
      return "No markets found";
    }

    for (const market of markets) {
      runtime.log(`📊 Processing Market #${market.id}: "${market.question}"`);

      // 2. Aggregate Data (Consensus-backed)
      const gatheredData = await dataSources.aggregateData(runtime, market.question, config);

      if (gatheredData.length === 0) {
        runtime.log(`⚠️ No data sources for market #${market.id}, skipping.`);
        continue;
      }

      // 3. AI Analysis (Consensus-backed)
      const aiResult = await ai.analyzeOutcome(
        runtime,
        market.question,
        market.outcomes,
        gatheredData,
        config.openAiApiKey || ""
      );

      if (aiResult.confidence < 0.7) {
        runtime.log(`⚠️ Low confidence (${aiResult.confidence}) for market #${market.id}. Skipping.`);
        continue;
      }

      runtime.log(`✅ DON Consensus reached: "${aiResult.outcome}"`);

      // 4. Secure On-chain Write (2-step pattern)
      // a) Generate signed report
      const settlementData = `receiveSettlement(uint256 ${market.id}, string "${aiResult.outcome}", bytes 0x)`;
      // Note: We'll use a manual encoding match for the report
      // In a real environment, we'd use encodeAbiParameters, but for simplicity we'll replicate the core logic
      const reportRequest = prepareReportRequest(aiResult.outcome as `0x${string}`);
      const report = runtime.report(reportRequest).result();

      // b) Submit report via EVM capability
      const txResult = await blockchain.submitSettlement(
        runtime,
        config.oracleContractAddress,
        report
      );

      runtime.log(`🎉 Market #${market.id} settled! TX Status: ${txResult.txStatus}`);
    }

    return "Workflow completed successfully";
  } catch (error) {
    runtime.log(`❌ Critical Error: ${error}`);
    throw error;
  }
};

const initWorkflow = (config: Config) => {
  const cron = new CronCapability();

  return [
    handler(
      cron.trigger({
        schedule: config.schedule,
      }),
      onCronTrigger
    ),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
