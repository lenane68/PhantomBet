import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("PhantomBet Prediction Market", function () {

    async function deployFixture() {
        const [owner, bettor1, bettor2, oracleNode] = await ethers.getSigners();

        // 1. Deploy Oracle first (it needs prediction market address, but circular dep? 
        // Actually CRESettlementOracle takes PM address in constructor.
        // PredictionMarket takes Oracle address in constructor.
        // We can deploy PM with a placeholder, then deploy Oracle, then update PM.

        // Deploy PredictionMarket with owner as temporary oracle
        const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
        const predictionMarket = await PredictionMarket.deploy(owner.address);

        // Deploy Oracle
        const CRESettlementOracle = await ethers.getContractFactory("CRESettlementOracle");
        const oracle = await CRESettlementOracle.deploy(await predictionMarket.getAddress());

        // Update PM to use real Oracle
        await predictionMarket.setOracle(await oracle.getAddress());

        // Authorize oracleNode in the Oracle contract
        await oracle.determineNodeAuth(oracleNode.address, true);

        return { predictionMarket, oracle, owner, bettor1, bettor2, oracleNode };
    }

    describe("Market Lifecycle", function () {
        it("Should create a market correctly", async function () {
            const { predictionMarket } = await loadFixture(deployFixture);

            const question = "Will BTC hit $100k by 2025?";
            const outcomes = ["Yes", "No"];
            const duration = 3600; // 1 hour
            const revealDuration = 1800; // 30 mins

            await expect(predictionMarket.createMarket(question, outcomes, duration, revealDuration))
                .to.emit(predictionMarket, "MarketCreated")
                .withArgs(0, question, ((x: any) => true)); // Ignore timestamp check here to avoid flakes

            const market = await predictionMarket.markets(0);
            expect(market.question).to.equal(question);
            expect(market.totalPool).to.equal(0);
        });
    });

    describe("Betting Phase (Commitment Scheme)", function () {
        it("Should allow placing a hidden bet", async function () {
            const { predictionMarket, bettor1 } = await loadFixture(deployFixture);

            // Create Market
            await predictionMarket.createMarket("Q1", ["A", "B"], 3600, 1800);
            const marketId = 0;

            // Prepare Commitment
            const amount = ethers.parseEther("1.0");
            const outcome = "A";
            const secret = "mySecret123";

            // Hash: keccak256(amount + outcome + secret)
            // We must match the solidity packing: abi.encodePacked(amount, outcome, secret)
            // In Ethers v6: solidityPackedKeccak256
            const commitment = ethers.solidityPackedKeccak256(
                ["uint256", "string", "string"],
                [amount, outcome, secret]
            );

            await expect(predictionMarket.connect(bettor1).placeBet(marketId, commitment, { value: amount }))
                .to.emit(predictionMarket, "BetPlaced")
                .withArgs(marketId, bettor1.address, commitment, amount);

            const market = await predictionMarket.markets(marketId);
            expect(market.totalPool).to.equal(amount);
        });
    });

    describe("Reveal Phase", function () {
        it("Should allow revealing a valid bet", async function () {
            const { predictionMarket, bettor1 } = await loadFixture(deployFixture);

            await predictionMarket.createMarket("Q1", ["A", "B"], 3600, 1800);
            const marketId = 0;

            const amount = ethers.parseEther("1.0");
            const outcome = "A";
            const secret = "mySecret123";
            const commitment = ethers.solidityPackedKeccak256(["uint256", "string", "string"], [amount, outcome, secret]);

            await predictionMarket.connect(bettor1).placeBet(marketId, commitment, { value: amount });

            // Fast forward to Reveal Phase
            await time.increase(3601);

            await expect(predictionMarket.connect(bettor1).revealBet(marketId, 0, secret, 0))
                .to.emit(predictionMarket, "BetRevealed")
                .withArgs(marketId, bettor1.address, outcome, amount);
        });

        it("Should reject invalid secrets", async function () {
            const { predictionMarket, bettor1 } = await loadFixture(deployFixture);

            await predictionMarket.createMarket("Q1", ["A", "B"], 3600, 1800);

            const amount = ethers.parseEther("1.0");
            const secret = "correctSecret";
            const commitment = ethers.solidityPackedKeccak256(["uint256", "string", "string"], [amount, "A", secret]);

            await predictionMarket.connect(bettor1).placeBet(0, commitment, { value: amount });
            await time.increase(3601);

            await expect(
                predictionMarket.connect(bettor1).revealBet(0, 0, "wrongSecret", 0)
            ).to.be.revertedWithCustomError(predictionMarket, "InvalidCommitment");
        });
    });

    describe("Settlement & Claiming", function () {
        it("Should settle market and distribute winnings", async function () {
            const { predictionMarket, oracle, bettor1, bettor2, oracleNode } = await loadFixture(deployFixture);

            // 1. Create Market
            await predictionMarket.createMarket("Q1", ["Win", "Lose"], 3600, 1800);
            const marketId = 0;

            // 2. Place Bets
            // Bettor 1: Bets 1 ETH on "Win"
            const amount1 = ethers.parseEther("1.0");
            const secret1 = "s1";
            const com1 = ethers.solidityPackedKeccak256(["uint256", "string", "string"], [amount1, "Win", secret1]);
            await predictionMarket.connect(bettor1).placeBet(marketId, com1, { value: amount1 });

            // Bettor 2: Bets 1 ETH on "Lose"
            const amount2 = ethers.parseEther("1.0");
            const secret2 = "s2";
            const com2 = ethers.solidityPackedKeccak256(["uint256", "string", "string"], [amount2, "Lose", secret2]);
            await predictionMarket.connect(bettor2).placeBet(marketId, com2, { value: amount2 });

            // 3. Reveal Phase
            await time.increase(3601);
            await predictionMarket.connect(bettor1).revealBet(marketId, 0, secret1, 0); // "Win" is index 0
            await predictionMarket.connect(bettor2).revealBet(marketId, 1, secret2, 0); // "Lose" is index 1

            // 4. Settle Phase (Wait for reveal deadline to pass)
            await time.increase(1801);

            // Oracle settles with "Win"
            await expect(oracle.connect(oracleNode).receiveSettlement(marketId, "Win", "0x"))
                .to.emit(predictionMarket, "MarketSettled")
                .withArgs(marketId, "Win");

            // 5. Claim Winnings
            // Total Pool = 2 ETH. "Win" pool = 1 ETH. Bettor1 share = (1 / 1) * 2 = 2 ETH.
            // Bettor2 share = 0.

            await expect(predictionMarket.connect(bettor1).claimWinnings(marketId))
                .to.changeEtherBalance(bettor1, ethers.parseEther("2.0"));

            await expect(predictionMarket.connect(bettor2).claimWinnings(marketId))
                .to.be.revertedWithCustomError(predictionMarket, "NoWinnings");
        });
    });
});
