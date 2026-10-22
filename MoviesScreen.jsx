import React, { useEffect, useState } from 'react';
import './theme.css';
import { quartoApi } from './api';
import HlsVideo from './HlsVideo';

function MovieCard({ m, onSelect }) {
  return (
    // Canais de filme vêm com logo (horizontal); filmes cadastrados, com pôster (vertical)
    <div className={`quarto-card${m.is_channel ? ' quarto-card--channel' : ''}`} tabIndex={0}
      onClick={() => onSelect(m)} onKeyDown={(e) => e.key === 'Enter' && onSelect(m)}>
      {m.poster_url
        ? <img src={m.poster_url} alt={m.title} loading="lazy" />
        : <div className="quarto-card-logo-empty">{m.title}</div>}
      <div className="quarto-card-title">{m.title}</div>
    </div>
  );
}

export default function MoviesScreen({ onBack }) {
  const [movies, setMovies] = useState([]);
  const [current, setCurrent] = useState(null);
  const [error, setError] = useState(null);
  const [playbackError, setPlaybackError] = useState(false);

  useEffect(() => {
    quartoApi.getMovies().then(setMovies).catch((e) => setError(e.message));
  }, []);

  const selecionar = (m) => {
    setPlaybackError(false);
    setCurrent(m);
  };

  // Filmes sem `origem` (listas antigas ou cadastradas à mão) contam como nacional.
  const nacionais = movies.filter((m) => m.origem !== 'internacional');
  const internacionais = movies.filter((m) => m.origem === 'internacional');

  return (
    <div className="quarto-root">
      <header className="quarto-header">
        <button className="quarto-back" onClick={current ? () => setCurrent(null) : onBack}>
          ← {current ? 'Filmes' : 'Início'}
        </button>
        <span className="quarto-brand">Filmes</span>
      </header>

      {current ? (
        <div style={{ padding: 24 }}>
          <HlsVideo src={current.video_url} onError={() => setPlaybackError(true)} />
          <p className="quarto-highlight" style={{ marginTop: 12 }}>{current.title}</p>
          {playbackError && (
            <p style={{ color: 'var(--qmuted)' }}>
              Este título está fora do ar ou bloqueado agora. Toque em "← Filmes" e escolha outro.
            </p>
          )}
          {current.synopsis && <p style={{ color: 'var(--qmuted)', maxWidth: 640 }}>{current.synopsis}</p>}
        </div>
      ) : (
        <>
          {error && <p style={{ color: 'var(--qmuted)', padding: '0 28px' }}>{error}</p>}
          {nacionais.length > 0 && (
            <>
              <h3 className="quarto-section-title">Filmes nacionais</h3>
              <div className="quarto-grid">
                {nacionais.map((m) => <MovieCard key={m.id} m={m} onSelect={selecionar} />)}
              </div>
            </>
          )}
          {internacionais.length > 0 && (
            <>
              <h3 className="quarto-section-title">Filmes internacionais</h3>
              <div className="quarto-grid">
                {internacionais.map((m) => <MovieCard key={m.id} m={m} onSelect={selecionar} />)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
