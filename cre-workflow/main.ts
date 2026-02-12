import {
  CronCapability,
  handler,
  Runner,
  prepareReportRequest,
  type Runtime,
} from "@chainlink/cre-sdk";
import { encodeAbiParameters } from "viem";
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

      if (!aiResult) {
        runtime.log(`⚠️ Consensus failed or AI error for market #${market.id}. Skipping.`);
        continue;
      }

      runtime.log(`✅ DON Consensus reached: "${aiResult}"`);

      // 4. Secure On-chain Write (2-step pattern)
      // a) ABI Encode the parameters for receiveSettlement(uint256, string, bytes)
      const encodedPayload = encodeAbiParameters(
        [
          { name: 'marketId', type: 'uint256' },
          { name: 'outcome', type: 'string' },
          { name: 'proof', type: 'bytes' }
        ],
        [market.id, aiResult as string, '0x']
      );

      // b) Generate signed report using the helper
      const reportRequest = prepareReportRequest(encodedPayload);
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
