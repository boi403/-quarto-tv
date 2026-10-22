import React, { useEffect, useState } from 'react';
import './theme.css';
import { quartoApi } from './api';
import HlsVideo from './HlsVideo';

function ChannelCard({ c, onSelect }) {
  return (
    <div className="quarto-card quarto-card--channel" tabIndex={0}
      onClick={() => onSelect(c)} onKeyDown={(e) => e.key === 'Enter' && onSelect(c)}>
      {c.logo_url
        ? <img src={c.logo_url} alt={c.name} loading="lazy" />
        : <div className="quarto-card-logo-empty">{c.name}</div>}
      <div className="quarto-card-title">{c.name}</div>
    </div>
  );
}

export default function ChannelsScreen({ onBack }) {
  const [channels, setChannels] = useState([]);
  const [current, setCurrent] = useState(null);
  const [error, setError] = useState(null);
  const [playbackError, setPlaybackError] = useState(false);

  useEffect(() => {
    quartoApi.getChannels().then(setChannels).catch((e) => setError(e.message));
  }, []);

  const selecionar = (c) => {
    setPlaybackError(false);
    setCurrent(c);
  };

  // Canais sem `origem` (listas antigas) contam como nacional por padrão.
  const nacionais = channels.filter((c) => c.origem !== 'internacional');
  const internacionais = channels.filter((c) => c.origem === 'internacional');

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
          <HlsVideo src={current.stream_url} onError={() => setPlaybackError(true)} />
          <p className="quarto-highlight" style={{ marginTop: 12 }}>{current.name}</p>
          {playbackError && (
            <p style={{ color: 'var(--qmuted)' }}>
              Este canal está fora do ar ou bloqueado agora. Toque em "← Canais" e escolha outro.
            </p>
          )}
        </div>
      ) : (
        <>
          {error && <p style={{ color: 'var(--qmuted)', padding: '0 28px' }}>{error}</p>}
          {nacionais.length > 0 && (
            <>
              <h3 className="quarto-section-title">Canais nacionais</h3>
              <div className="quarto-grid">
                {nacionais.map((c) => <ChannelCard key={c.id} c={c} onSelect={selecionar} />)}
              </div>
            </>
          )}
          {internacionais.length > 0 && (
            <>
              <h3 className="quarto-section-title">Canais internacionais</h3>
              <div className="quarto-grid">
                {internacionais.map((c) => <ChannelCard key={c.id} c={c} onSelect={selecionar} />)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
