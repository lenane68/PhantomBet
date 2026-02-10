import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Using account:", deployer.address);

    const pmAddress = process.env.PREDICTION_MARKET_ADDRESS;
    const oracleAddress = process.env.CRE_ORACLE_ADDRESS;

    if (!pmAddress || !oracleAddress) {
        throw new Error("Missing contract addresses in .env");
    }

    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    const pm = PredictionMarket.attach(pmAddress) as any;

    // 1. Create a Market with short deadlines for testing
    console.log("\n1. Creating a test market...");
    const question = "Live Test: Will this transaction succeed? " + Date.now();
    const outcomes = ["Yes", "No"];
    const duration = 120; // 2 minutes betting
    const revealDuration = 120; // 2 minutes reveal

    const createTx = await pm.createMarket(question, outcomes, duration, revealDuration);
    await createTx.wait();
    const marketId = (await pm.nextMarketId()) - 1n;
    console.log(`Market created! ID: ${marketId}`);

    // 2. Place a Bet
    console.log("\n2. Placing a bet...");
    const amount = ethers.parseEther("0.001");
    const outcomeStr = "Yes";
    const secret = "testSecret123";

    // Hash: keccak256(abi.encodePacked(amount, outcomeStr, secret))
    const commitment = ethers.solidityPackedKeccak256(
        ["uint256", "string", "string"],
        [amount, outcomeStr, secret]
    );

    const betTx = await pm.placeBet(marketId, commitment, { value: amount });
    await betTx.wait();
    console.log("Bet placed with commitment:", commitment);

    console.log("\n--- SMOKE TEST INITIALIZED ---");
    console.log("Next Steps:");
    console.log(`1. Wait 2 minutes for betting to end.`);
    console.log(`2. Run: npx hardhat run scripts/reveal-test-bet.ts --network arbitrum-sepolia`);
    console.log(`   (I will create this script next)`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
