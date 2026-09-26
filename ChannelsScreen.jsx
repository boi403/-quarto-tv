import React, { useEffect, useState } from 'react';
import './theme.css';
import { quartoApi } from './api';
import HlsVideo from './HlsVideo';

export default function ChannelsScreen({ onBack }) {
  const [channels, setChannels] = useState([]);
  const [current, setCurrent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    quartoApi.getChannels().then(setChannels).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="quarto-root">
      <header className="quarto-header">
        <button className="quarto-back" onClick={current ? () => setCurrent(null) : onBack}>
          ← {current ? 'Canais' : 'Início'}
        </button>
        <span className="quarto-brand">Canais ao vivo</span>
      </header>

      {current ? (
        <div style={{ padding: 24 }}>
          <HlsVideo src={current.stream_url} />
          <p className="quarto-highlight" style={{ marginTop: 12 }}>{current.name}</p>
        </div>
      ) : (
        <div className="quarto-grid">
          {error && <p style={{ color: 'var(--qmuted)' }}>{error}</p>}
          {channels.map((c) => (
            <div key={c.id} className="quarto-card quarto-card--channel" tabIndex={0}
              onClick={() => setCurrent(c)} onKeyDown={(e) => e.key === 'Enter' && setCurrent(c)}>
              {c.logo_url
                ? <img src={c.logo_url} alt={c.name} loading="lazy" />
                : <div className="quarto-card-logo-empty">{c.name}</div>}
              <div className="quarto-card-title">{c.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
