import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { useWriteContract, usePublicClient } from 'wagmi';
import { PREDICTION_MARKET_ADDRESS, PREDICTION_MARKET_ABI } from '../contracts';

interface CreateMarketModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreateMarketModal = ({ isOpen, onClose }: CreateMarketModalProps) => {
    const [question, setQuestion] = useState('');
    const [outcomes, setOutcomes] = useState('Yes, No');
    const [duration, setDuration] = useState('3600');
    const [revealDuration, setRevealDuration] = useState('3600');

    const publicClient = usePublicClient();
    const { writeContractAsync } = useWriteContract();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const outcomeArray = outcomes.split(',').map(s => s.trim()).filter(s => s !== '');

        try {
            // Calculate fees with 50% buffer to handle Arbitrum Sepolia volatility
            const feeData = await publicClient?.estimateFeesPerGas();
            let maxFeePerGas = undefined;
            let maxPriorityFeePerGas = undefined;

            if (feeData?.maxFeePerGas && feeData?.maxPriorityFeePerGas) {
                // Buffer increased to 50% (150/100)
                maxFeePerGas = (feeData.maxFeePerGas * 150n) / 100n;
                maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
            }

            // 1. Send transaction (User signs in wallet)
            const hash = await writeContractAsync({
                address: PREDICTION_MARKET_ADDRESS,
                abi: PREDICTION_MARKET_ABI,
                functionName: 'createMarket',
                args: [
                    question,
                    outcomeArray,
                    BigInt(duration),
                    BigInt(revealDuration)
                ],
                maxFeePerGas,
                maxPriorityFeePerGas
            });

            // 2. Transaction signed - Close modal & show loading toast
            onClose();
            toast.loading('Transaction submitted. Creating market...', { id: 'create-market' });

            // 3. Wait for receipt
            const receipt = await publicClient?.waitForTransactionReceipt({ hash });

            // 4. Update toast based on status
            if (receipt?.status === 'success') {
                toast.success('Market created successfully!', { id: 'create-market' });
            } else {
                toast.error('Transaction failed.', { id: 'create-market' });
            }
        } catch (error: any) {
            console.error(error);
            if (error.message && error.message.includes('message channel closed')) {
                toast.error('Wallet connection lost. Please refresh the page.', { id: 'create-market' });
            } else {
                toast.error('Failed to create market.', { id: 'create-market' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-content glass transition-all animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="modal-glow"></div>

                <div className="modal-header">
                    <h2 className="modal-title">Create New Market</h2>
                    <button className="close-btn" onClick={onClose} aria-label="Close">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="create-market-form">
                    <div className="form-group">
                        <label>Prediction Question</label>
                        <input
                            type="text"
                            className="premium-input"
                            value={question}
                            onChange={e => setQuestion(e.target.value)}
                            placeholder="e.g. Will BTC reach $100k in 2026?"
                            required
                        />
                        <span className="input-hint">Clear and objective questions work best</span>
                    </div>

                    <div className="form-group">
                        <label>Potential Outcomes</label>
                        <input
                            type="text"
                            className="premium-input"
                            value={outcomes}
                            onChange={e => setOutcomes(e.target.value)}
                            placeholder="Yes, No"
                            required
                        />
                        <span className="input-hint">Separate outcomes with commas</span>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Betting Period (s)</label>
                            <input
                                type="number"
                                className="premium-input"
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Reveal Period (s)</label>
                            <input
                                type="number"
                                className="premium-input"
                                value={revealDuration}
                                onChange={e => setRevealDuration(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-main glow-hover" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <span className="flex-center">
                                    <span className="mini-spinner"></span> Creating...
                                </span>
                            ) : 'Launch Market'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999; /* Higher z-index for portal */
                    padding: 24px;
                }

                .modal-content {
                    width: 100%;
                    max-width: 540px;
                    padding: 40px;
                    border-radius: 24px;
                    background: rgba(18, 18, 20, 0.95); /* Even higher opacity */
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }

                .modal-glow {
                    position: absolute;
                    top: -100px;
                    left: -100px;
                    width: 200px;
                    height: 200px;
                    background: var(--accent-cyan);
                    filter: blur(80px);
                    opacity: 0.15;
                    pointer-events: none;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 32px;
                }

                .modal-title {
                    font-size: 1.75rem;
                    background: var(--gradient-neon);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    font-weight: 700;
                }

                .close-btn {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: var(--text-secondary);
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .close-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    transform: rotate(90deg);
                }

                .create-market-form {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                label {
                    font-size: 0.85rem;
                    color: var(--text-primary);
                    font-weight: 600;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                }

                .premium-input {
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 14px 18px;
                    border-radius: var(--radius-md);
                    color: white;
                    outline: none;
                    font-family: inherit;
                    font-size: 1rem;
                    transition: all 0.2s;
                }

                .premium-input:focus {
                    border-color: var(--accent-cyan);
                    background: rgba(255, 255, 255, 0.05);
                    box-shadow: 0 0 0 4px rgba(0, 245, 255, 0.1);
                }

                .input-hint {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }

                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 16px;
                    margin-top: 12px;
                }

                .btn-cancel {
                    padding: 14px 24px;
                    background: transparent;
                    color: var(--text-secondary);
                    border: none;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-cancel:hover {
                    color: white;
                }

                .btn-main {
                    padding: 14px 32px;
                    background: var(--gradient-neon);
                    color: black;
                    border: none;
                    border-radius: var(--radius-md);
                    font-weight: 700;
                    cursor: pointer;
                    font-size: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out;
                }

                .animate-slide-up {
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .mini-spinner {
                    width: 18px;
                    height: 18px;
                    border: 2px solid rgba(0,0,0,0.1);
                    border-top-color: black;
                    border-radius: 50%;
                    display: inline-block;
                    margin-right: 8px;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .flex-center {
                    display: flex;
                    align-items: center;
                }
            `}</style>
        </div>,
        document.body
    );
};

export default CreateMarketModal;
