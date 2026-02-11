import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

async function main() {
    console.log("Starting verification...");

    const pmAddress = process.env.PREDICTION_MARKET_ADDRESS;
    if (!pmAddress) throw new Error("Missing PREDICTION_MARKET_ADDRESS");

    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    const pm = PredictionMarket.attach(pmAddress) as any;

    console.log(`Attached to PredictionMarket at ${pmAddress}`);

    // Create a market with custom outcomes
    const question = "Verification: Can we fetch outcomes? " + Date.now();
    const outcomes = ["Absolutely", "Maybe", "Nope"];
    const duration = 300;
    const revealDuration = 300;

    console.log("Creating market...");
    const tx = await pm.createMarket(question, outcomes, duration, revealDuration);
    await tx.wait();

    const marketId = (await pm.nextMarketId()) - 1n;
    console.log(`Market created with ID: ${marketId}`);

    // Fetch outcomes
    console.log("Fetching outcomes...");
    const fetchedOutcomes = await pm.getMarketOutcomes(marketId);
    console.log("Fetched Outcomes:", fetchedOutcomes);

    // Verify
    const isMatch = outcomes.length === fetchedOutcomes.length &&
        outcomes.every((val, index) => val === fetchedOutcomes[index]);

    if (isMatch) {
        console.log("SUCCESS: Outcomes match!");
    } else {
        console.error("FAILURE: Outcomes do not match.");
        console.error("Expected:", outcomes);
        console.error("Got:", fetchedOutcomes);
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
