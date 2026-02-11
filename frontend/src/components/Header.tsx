import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract } from 'wagmi';
import { PREDICTION_MARKET_ADDRESS, PREDICTION_MARKET_ABI } from '../contracts';
import CreateMarketModal from './CreateMarketModal';

const Header = () => {
  const { address, isConnected } = useAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: owner } = useReadContract({
    address: PREDICTION_MARKET_ADDRESS,
    abi: PREDICTION_MARKET_ABI,
    functionName: 'owner',
  });

  const isOwner = isConnected && address && owner && address.toLowerCase() === (owner as string).toLowerCase();

  return (
    <header className="header glass">
      <div className="header-content">
        <div className="logo-group">
          <div className="logo-icon"></div>
          <span className="logo-text">PhantomBet</span>
        </div>

        <nav className="nav-links">
          <a href="#" className="nav-link active">Markets</a>
          <a href="#" className="nav-link">Activity</a>
          <a href="#" className="nav-link">Governance</a>
        </nav>

        <div className="actions">
          {isOwner && (
            <button
              className="btn-create"
              onClick={() => setIsModalOpen(true)}
            >
              Create Market
            </button>
          )}
          <ConnectButton
            accountStatus="address"
            showBalance={false}
          />
        </div>
      </div>

      <CreateMarketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <style>{`
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 80px;
          z-index: 1000;
          border-bottom: 1px solid var(--card-border);
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
        }

        .logo-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
          background: var(--gradient-neon);
          border-radius: 8px;
          position: relative;
        }

        .logo-icon::after {
          content: '';
          position: absolute;
          inset: 0;
          background: inherit;
          filter: blur(8px);
          opacity: 0.5;
        }

        .logo-text {
          font-family: 'Outfit', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .nav-links {
          display: flex;
          gap: 32px;
        }

        .nav-link {
          color: var(--text-secondary);
          text-decoration: none;
          font-weight: 500;
          font-size: 0.95rem;
          transition: color 0.2s;
        }

        .nav-link:hover, .nav-link.active {
          color: var(--text-primary);
        }

        .nav-link.active {
          position: relative;
        }

        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--accent-cyan);
          box-shadow: 0 0 10px var(--accent-cyan);
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .btn-create {
          background: rgba(0, 245, 255, 0.1);
          border: 1px solid var(--accent-cyan);
          color: var(--accent-cyan);
          padding: 8px 16px;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-create:hover {
          background: var(--accent-cyan);
          color: black;
          box-shadow: 0 0 15px rgba(0, 245, 255, 0.4);
        }
      `}</style>
    </header>
  );
};

export default Header;
