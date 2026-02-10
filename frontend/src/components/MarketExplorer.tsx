import React from 'react';
import { useMarkets } from '../hooks/useMarkets';
import MarketCard from './MarketCard';

const MarketExplorer = () => {
  const { markets, isLoading } = useMarkets();
  const [filter, setFilter] = React.useState('All');

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Scanning the blockchain...</p>
      </div>
    );
  }

  const now = BigInt(Math.floor(Date.now() / 1000));

  const filteredMarkets = markets.filter(m => {
    if (filter === 'All') return true;
    if (filter === 'Betting') return now < m.bettingDeadline && !m.settled;
    if (filter === 'Revealing') return now >= m.bettingDeadline && now < m.revealDeadline && !m.revealed && !m.settled;
    if (filter === 'Settled') return m.settled;
    return true;
  });

  return (
    <div className="market-explorer">
      <div className="explorer-header">
        <h2 className="heading">Active Markets</h2>
        <div className="filters glass-pill">
          {['All', 'Betting', 'Revealing', 'Settled'].map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="market-grid">
        {filteredMarkets.length > 0 ? (
          filteredMarkets.map((market) => (
            <MarketCard key={market.id.toString()} market={market} />
          ))
        ) : (
          <div className="empty-state glass">
            <p>No {filter !== 'All' ? filter.toLowerCase() : ''} markets found.</p>
          </div>
        )}
      </div>

      <style>{`
        .market-explorer {
          margin-top: 40px;
        }

        .explorer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .filters {
          display: flex;
          padding: 8px;
          gap: 4px;
        }

        .filter-btn {
          padding: 8px 16px;
          border-radius: 999px;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn.active {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }

        .market-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 24px;
        }

        .loading-state, .empty-state {
          text-align: center;
          padding: 80px;
          border-radius: var(--radius-lg);
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: var(--accent-cyan);
          border-radius: 50%;
          margin: 0 auto 16px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MarketExplorer;
