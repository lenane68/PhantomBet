import React from 'react';
import Header from './components/Header';
import MarketExplorer from './components/MarketExplorer';

function App() {
  return (
    <div className="app-container">
      <Header />

      <main className="content">
        <section className="hero">
          <h1 className="hero-title">
            Bet in the <span className="highlight">Shadows.</span><br />
            Settle with <span className="highlight">Truth.</span>
          </h1>
          <p className="hero-subtitle">
            The first privacy-first prediction market powered by Chainlink CRE and AI analysis.
          </p>

          <div className="btn-group">
            <button className="btn-primary">Explore Markets</button>
            <button className="btn-secondary">Learn More</button>
          </div>
        </section>

        <MarketExplorer />
      </main>

      <style>{`
        .app-container {
          min-height: 100vh;
          background-image: 
            radial-gradient(circle at 10% 20%, rgba(0, 245, 255, 0.03) 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(157, 0, 255, 0.03) 0%, transparent 40%);
        }

        .content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 120px 24px 64px;
        }

        .hero {
          text-align: center;
          margin-bottom: 80px;
        }

        .hero-title {
          font-size: clamp(2.5rem, 8vw, 4.5rem);
          line-height: 1.1;
          margin-bottom: 24px;
          font-weight: 700;
        }

        .highlight {
          background: var(--gradient-neon);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: var(--text-secondary);
          max-width: 600px;
          margin: 0 auto 40px;
          line-height: 1.6;
        }

        .btn-group {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        button {
          padding: 14px 28px;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-primary {
          background: var(--text-primary);
          color: black;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(255, 255, 255, 0.2);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}

export default App;
