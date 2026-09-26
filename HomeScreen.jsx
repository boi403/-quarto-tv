import React, { useState } from 'react';
import './theme.css';
import ChannelsScreen from './ChannelsScreen';
import MoviesScreen from './MoviesScreen';
import RoomServiceScreen from './RoomServiceScreen';
import RequestsScreen from './RequestsScreen';

// room={ number, guestName } — vem do contrato de dados do PMS no check-in,
// do mesmo jeito que a sinalização já recebe nome/idioma do hóspede.
export default function HomeScreen({ room, hotelName = 'Araguaia Palace Hotel', logoUrl = `${import.meta.env.BASE_URL}logo-transparente.png` }) {
  const [screen, setScreen] = useState('home');

  const tiles = [
    { key: 'channels', icon: '📺', label: 'Canais ao vivo', sub: 'Notícias, esportes, TV aberta' },
    { key: 'movies', icon: '🎬', label: 'Filmes', sub: 'Canais de filmes e séries' },
    { key: 'roomservice', icon: '🍽️', label: 'Room service', sub: 'Pedidos pelo WhatsApp' },
    { key: 'requests', icon: '🔔', label: 'Solicitações', sub: 'Toalhas, limpeza, manutenção — via WhatsApp' },
  ];

  if (screen === 'channels') return <ChannelsScreen onBack={() => setScreen('home')} />;
  if (screen === 'movies') return <MoviesScreen onBack={() => setScreen('home')} />;
  if (screen === 'roomservice') return <RoomServiceScreen room={room} onBack={() => setScreen('home')} />;
  if (screen === 'requests') return <RequestsScreen room={room} onBack={() => setScreen('home')} />;

  return (
    <div className="quarto-root">
      <header className="quarto-header">
        <span className="quarto-brand-wrap">
          {logoUrl && <img className="quarto-logo" src={logoUrl} alt="" />}
          <span className="quarto-brand">{hotelName}</span>
        </span>
        <span style={{ color: 'var(--qmuted)' }}>
          {room?.guestName ? `Bem-vindo(a), ${room.guestName} · ` : ''}Quarto {room?.number}
        </span>
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
