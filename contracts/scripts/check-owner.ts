import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    const pmAddress = process.env.PREDICTION_MARKET_ADDRESS;
    if (!pmAddress) throw new Error("PREDICTION_MARKET_ADDRESS not found");

    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    const pm = PredictionMarket.attach(pmAddress) as any;

    const owner = await pm.owner();
    console.log("Contract Address:", pmAddress);
    console.log("Contract Owner:", owner);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
