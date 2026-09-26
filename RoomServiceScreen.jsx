import React, { useState } from 'react';
import './theme.css';
import { ROOM_SERVICE_OPCOES } from './quarto.config';
import QrWhatsApp from './QrWhatsApp';

// Pedidos pelo WhatsApp: o hóspede escolhe na TV e escaneia o QR com o celular.
// Opções e números ficam em quarto.config.js.
export default function RoomServiceScreen({ room, onBack }) {
  const [opcao, setOpcao] = useState(null);

  return (
    <div className="quarto-root">
      <header className="quarto-header">
        <button className="quarto-back" onClick={opcao ? () => setOpcao(null) : onBack}>
          ← {opcao ? 'Room service' : 'Início'}
        </button>
        <span className="quarto-brand">Room service</span>
      </header>

      {opcao ? (
        <QrWhatsApp opcao={opcao} room={room} onVoltar={() => setOpcao(null)} />
      ) : (
        <div className="quarto-tiles">
          {ROOM_SERVICE_OPCOES.map((o) => (
            <div key={o.key} className="quarto-tile" role="button" tabIndex={0}
              onClick={() => setOpcao(o)} onKeyDown={(e) => e.key === 'Enter' && setOpcao(o)}>
              <span className="quarto-tile-icon">{o.icon}</span>
              <span className="quarto-tile-label">{o.label}</span>
              {o.sub && <span className="quarto-tile-sub">{o.sub}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
