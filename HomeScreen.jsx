import React, { useState } from 'react';
import './theme.css';
import ChannelsScreen from './ChannelsScreen';
import MoviesScreen from './MoviesScreen';

// room é opcional — só é exibido se algum dia a tela voltar a receber
// número do quarto (ex.: contrato de dados do PMS no check-in).
export default function HomeScreen({ room, hotelName = '', logoUrl = '' }) {
  const [screen, setScreen] = useState('home');

  const tiles = [
    { key: 'channels', icon: '📺', label: 'Canais ao vivo', sub: 'Notícias, esportes, TV aberta' },
    { key: 'movies', icon: '🎬', label: 'Filmes', sub: 'Canais de filmes e séries' },
  ];

  if (screen === 'channels') return <ChannelsScreen onBack={() => setScreen('home')} />;
  if (screen === 'movies') return <MoviesScreen onBack={() => setScreen('home')} />;

  return (
    <div className="quarto-root">
      <header className="quarto-header">
        <span className="quarto-brand-wrap">
          {logoUrl && <img className="quarto-logo" src={logoUrl} alt="" />}
          {hotelName && <span className="quarto-brand">{hotelName}</span>}
        </span>
        {room?.number && (
          <span style={{ color: 'var(--qmuted)' }}>
            {room.guestName ? `Bem-vindo(a), ${room.guestName} · ` : ''}Quarto {room.number}
          </span>
        )}
      </header>
      <div className="quarto-tiles">
        {tiles.map((t) => (
          <div
            key={t.key}
            className="quarto-tile"
            tabIndex={0}
            role="button"
            onClick={() => setScreen(t.key)}
            onKeyDown={(e) => e.key === 'Enter' && setScreen(t.key)}
          >
            <span className="quarto-tile-icon">{t.icon}</span>
            <span className="quarto-tile-label">{t.label}</span>
            <span className="quarto-tile-sub">{t.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
