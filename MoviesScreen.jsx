import React, { useEffect, useState } from 'react';
import './theme.css';
import { quartoApi } from './api';
import HlsVideo from './HlsVideo';

export default function MoviesScreen({ onBack }) {
  const [movies, setMovies] = useState([]);
  const [current, setCurrent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    quartoApi.getMovies().then(setMovies).catch((e) => setError(e.message));
  }, []);

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
          <HlsVideo src={current.video_url} />
          <p className="quarto-highlight" style={{ marginTop: 12 }}>{current.title}</p>
          {current.synopsis && <p style={{ color: 'var(--qmuted)', maxWidth: 640 }}>{current.synopsis}</p>}
        </div>
      ) : (
        <div className="quarto-grid">
          {error && <p style={{ color: 'var(--qmuted)' }}>{error}</p>}
          {movies.map((m) => (
            // Canais de filme vêm com logo (horizontal); filmes cadastrados, com pôster (vertical)
            <div key={m.id} className={`quarto-card${m.is_channel ? ' quarto-card--channel' : ''}`} tabIndex={0}
              onClick={() => setCurrent(m)} onKeyDown={(e) => e.key === 'Enter' && setCurrent(m)}>
              {m.poster_url
                ? <img src={m.poster_url} alt={m.title} loading="lazy" />
                : <div className="quarto-card-logo-empty">{m.title}</div>}
              <div className="quarto-card-title">{m.title}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
