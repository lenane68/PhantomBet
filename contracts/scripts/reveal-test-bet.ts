import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

async function main() {
    const [deployer] = await ethers.getSigners();

    const pmAddress = process.env.PREDICTION_MARKET_ADDRESS;
    if (!pmAddress) throw new Error("Missing PM address");

    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    const pm = PredictionMarket.attach(pmAddress) as any;

    const marketId = (await pm.nextMarketId()) - 1n;
    const secret = "testSecret123";
    const outcomeIndex = 0; // "Yes"

    console.log(`Revealing bet for Market #${marketId}...`);

    // revealBet(marketId, outcomeIndex, secret, betIndex)
    const tx = await pm.revealBet(marketId, outcomeIndex, secret, 0);
    await tx.wait();

    console.log("Bet revealed successfully!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
