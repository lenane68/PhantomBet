import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { PREDICTION_MARKET_ADDRESS, PREDICTION_MARKET_ABI } from '../contracts';
import { Market } from '../hooks/useMarkets';
import { Vault } from '../utils/vault';

interface MarketCardProps {
    market: Market;
}

const MarketCard = ({ market }: MarketCardProps) => {
    const { isConnected } = useAccount();
    const [betAmount, setBetAmount] = useState('0.01');
    const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
    const [isRevealing, setIsRevealing] = useState(false);

    const { writeContract, data: hash } = useWriteContract();
    const { isLoading: isWaiting } = useWaitForTransactionReceipt({ hash });

    const now = BigInt(Math.floor(Date.now() / 1000));
    const isBettingActive = now < market.bettingDeadline;
    const isRevealActive = !isBettingActive && now < market.revealDeadline && !market.revealed;

    // Fake outcomes for now as we don't fetch them from storage yet (need to update hook)
    const outcomes = ["Yes", "No"];

    const handlePlaceBet = async () => {
        if (selectedOutcome === null) return;

        const secret = Math.random().toString(36).substring(7);
        const amount = parseEther(betAmount);

        // Commitment: keccak256(abi.encodePacked(amount, outcomeStr, secret))
        const commitment = ethers.solidityPackedKeccak256(
            ["uint256", "string", "string"],
            [amount, outcomes[selectedOutcome], secret]
        ) as `0x${string}`;

        Vault.saveSecret(market.id, {
            outcome: outcomes[selectedOutcome],
            outcomeIndex: selectedOutcome,
            secret
        });

        writeContract({
            address: PREDICTION_MARKET_ADDRESS,
            abi: PREDICTION_MARKET_ABI,
            functionName: 'placeBet',
            args: [market.id, commitment],
            value: amount,
        });
    };

    const handleReveal = async () => {
        const saved = Vault.getSecret(market.id);
        if (!saved) return;

        writeContract({
            address: PREDICTION_MARKET_ADDRESS,
            abi: PREDICTION_MARKET_ABI,
            functionName: 'revealBet',
            args: [market.id, BigInt(saved.outcomeIndex), saved.secret, BigInt(0)], // Assuming 1st bet for demo
        });
    };

    return (
        <div className="market-card glass transition-all glow-hover">
            <div className="card-status">
                {market.settled ? (
                    <span className="badge settled">Settled</span>
                ) : isBettingActive ? (
                    <span className="badge active">Betting Open</span>
                ) : isRevealActive ? (
                    <span className="badge reveal">Reveal Phase</span>
                ) : (
                    <span className="badge closed">Closed</span>
                )}
                <span className="pool">Total Pool: {formatEther(market.totalPool)} ETH</span>
            </div>

            <h3 className="market-question">{market.question}</h3>

            {!market.settled && (
                <div className="betting-area">
                    {isBettingActive ? (
                        <>
                            <div className="outcome-btns">
                                {outcomes.map((o, i) => (
                                    <button
                                        key={i}
                                        className={`outcome-btn ${selectedOutcome === i ? 'selected' : ''}`}
                                        onClick={() => setSelectedOutcome(i)}
                                    >
                                        {o}
                                    </button>
                                ))}
                            </div>
                            <div className="input-group">
                                <input
                                    type="number"
                                    value={betAmount}
                                    onChange={(e) => setBetAmount(e.target.value)}
                                    placeholder="0.01"
                                />
                                <button
                                    className="btn-main"
                                    onClick={handlePlaceBet}
                                    disabled={!isConnected || isWaiting}
                                >
                                    {isWaiting ? 'Confirming...' : 'Place Private Bet'}
                                </button>
                            </div>
                        </>
                    ) : isRevealActive ? (
                        <div className="reveal-area">
                            <p className="hint">Reveal phase is active! Use your stored secret to verify your bet.</p>
                            <button className="btn-reveal" onClick={handleReveal}>
                                Reveal My Bet
                            </button>
                        </div>
                    ) : (
                        <p className="final-msg">Waiting for AI settlement...</p>
                    )}
                </div>
            )}

            {market.settled && (
                <div className="settled-info">
                    <p>Result: <span className="winner">{outcomes[Number(market.finalOutcomeId)] || market.finalOutcomeId.toString()}</span></p>
                    <button className="btn-claim">Claim Winnings</button>
                </div>
            )}

            <style>{`
        .market-card {
          padding: 24px;
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .card-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
        }

        .badge {
          padding: 4px 12px;
          border-radius: 99px;
          font-weight: 600;
        }

        .badge.active { background: rgba(0, 245, 255, 0.1); color: var(--accent-cyan); }
        .badge.reveal { background: rgba(157, 0, 255, 0.1); color: var(--accent-purple); }
        .badge.settled { background: rgba(0, 255, 127, 0.1); color: #00ff7f; }
        .badge.closed { background: rgba(255, 255, 255, 0.05); color: var(--text-muted); }

        .pool { color: var(--text-secondary); }

        .market-question {
          font-size: 1.4rem;
          line-height: 1.4;
        }

        .outcome-btns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        .outcome-btn {
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .outcome-btn.selected {
          border-color: var(--accent-cyan);
          background: rgba(0, 245, 255, 0.05);
        }

        .input-group {
          display: flex;
          gap: 8px;
        }

        input {
          flex: 1;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 12px;
          border-radius: var(--radius-md);
          color: white;
          outline: none;
        }

        .btn-main, .btn-reveal, .btn-claim {
          padding: 12px 24px;
          border-radius: var(--radius-md);
          border: none;
          font-weight: 700;
          cursor: pointer;
        }

        .btn-main { background: var(--gradient-neon); color: black; }
        .btn-reveal { background: var(--accent-purple); color: white; width: 100%; }
        .btn-claim { background: #00ff7f; color: black; width: 100%; }
      `}</style>
        </div>
    );
};

export default MarketCard;
