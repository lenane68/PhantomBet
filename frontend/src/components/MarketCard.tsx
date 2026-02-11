import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { PREDICTION_MARKET_ADDRESS, PREDICTION_MARKET_ABI } from '../contracts';
import { Market } from '../hooks/useMarkets';
import { Vault } from '../utils/vault';
import toast from 'react-hot-toast';

interface MarketCardProps {
    market: Market;
}

const MarketCard = ({ market }: MarketCardProps) => {
    const { isConnected } = useAccount();
    const [betAmount, setBetAmount] = useState('0.01');
    const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
    const [isRevealing, setIsRevealing] = useState(false);

    const publicClient = usePublicClient();
    const { writeContractAsync, isPending } = useWriteContract();

    const now = BigInt(Math.floor(Date.now() / 1000));
    const isBettingActive = now < market.bettingDeadline;
    const isRevealActive = !isBettingActive && now < market.revealDeadline && !market.revealed;

    // Use outcomes from the hook
    const outcomes = market.outcomes && market.outcomes.length > 0 ? market.outcomes : ["Yes", "No"];

    const handlePlaceBet = async () => {
        if (selectedOutcome === null) {
            toast.error('Please select an outcome first');
            return;
        }

        try {
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

            // Calculate fees with 50% buffer to handle Arbitrum Sepolia volatility
            const feeData = await publicClient?.estimateFeesPerGas();
            let maxFeePerGas = undefined;
            let maxPriorityFeePerGas = undefined;

            if (feeData?.maxFeePerGas && feeData?.maxPriorityFeePerGas) {
                // Buffer increased to 50% (150/100)
                maxFeePerGas = (feeData.maxFeePerGas * 150n) / 100n;
                maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
            }

            const hash = await writeContractAsync({
                address: PREDICTION_MARKET_ADDRESS,
                abi: PREDICTION_MARKET_ABI,
                functionName: 'placeBet',
                args: [market.id, commitment],
                value: amount,
                maxFeePerGas,
                maxPriorityFeePerGas
            });

            toast.loading('Placing bet...', { id: 'place-bet' });

            const receipt = await publicClient?.waitForTransactionReceipt({ hash });

            if (receipt?.status === 'success') {
                toast.success('Bet placed successfully!', { id: 'place-bet' });
                // Reset form
                setBetAmount('0.01');
                setSelectedOutcome(null);
            } else {
                toast.error('Bet transaction failed.', { id: 'place-bet' });
            }

        } catch (error: any) {
            console.error(error);
            if (error.message && error.message.includes('message channel closed')) {
                toast.error('Wallet connection lost. Please refresh the page.', { id: 'place-bet' });
            } else {
                toast.error('Failed to place bet', { id: 'place-bet' });
            }
        }
    };

    const handleReveal = async () => {
        const saved = Vault.getSecret(market.id);
        if (!saved) {
            toast.error('No secret found for this market');
            return;
        }

        try {
            const hash = await writeContractAsync({
                address: PREDICTION_MARKET_ADDRESS,
                abi: PREDICTION_MARKET_ABI,
                functionName: 'revealBet',
                args: [market.id, BigInt(saved.outcomeIndex), saved.secret, BigInt(0)],
            });

            toast.loading('Revealing bet...', { id: 'reveal-bet' });

            const receipt = await publicClient?.waitForTransactionReceipt({ hash });

            if (receipt?.status === 'success') {
                toast.success('Bet revealed successfully!', { id: 'reveal-bet' });
                setIsRevealing(false); // Update local state if needed
            } else {
                toast.error('Reveal transaction failed.', { id: 'reveal-bet' });
            }
        } catch (error: any) {
            console.error(error);
            if (error.message && error.message.includes('message channel closed')) {
                toast.error('Wallet connection lost. Please refresh the page.', { id: 'reveal-bet' });
            } else {
                toast.error('Failed to reveal bet', { id: 'reveal-bet' });
            }
        }
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
                                    disabled={!isConnected || isPending}
                                >
                                    {isPending ? 'Confirming...' : 'Place Private Bet'}
                                </button>
                            </div>
                            <div className="warning-banner">
                                <span className="warning-icon">⚠️</span>
                                <p><strong>IMPORTANT:</strong> You must return during the <strong>Reveal Phase</strong> to confirm your bet. If you miss this window, your funds will be lost forever.</p>
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

        .warning-banner {
          background: rgba(255, 179, 0, 0.1);
          border: 1px solid rgba(255, 179, 0, 0.4);
          color: #ffb300;
          padding: 12px;
          border-radius: var(--radius-md);
          font-size: 0.75rem;
          margin-top: 12px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          line-height: 1.4;
        }

        .warning-banner strong {
          font-weight: 700;
          color: #ffd700;
        }

        .warning-icon {
          font-size: 1.1rem;
          flex-shrink: 0;
        }
      `}</style>
        </div>
    );
};

export default MarketCard;
