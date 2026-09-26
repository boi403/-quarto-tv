import React, { useState } from 'react';
import './theme.css';
import { SOLICITACOES_OPCOES } from './quarto.config';
import QrWhatsApp from './QrWhatsApp';

// Solicitações pelo WhatsApp da recepção — opções em quarto.config.js.
export default function RequestsScreen({ room, onBack }) {
  const [opcao, setOpcao] = useState(null);

  return (
    <div className="quarto-root">
      <header className="quarto-header">
        <button className="quarto-back" onClick={opcao ? () => setOpcao(null) : onBack}>
          ← {opcao ? 'Solicitações' : 'Início'}
        </button>
        <span className="quarto-brand">Solicitações</span>
      </header>

      {opcao ? (
        <QrWhatsApp opcao={opcao} room={room} onVoltar={() => setOpcao(null)} />
      ) : (
        <div className="quarto-tiles">
          {SOLICITACOES_OPCOES.map((o) => (
            <div key={o.key} className="quarto-tile" role="button" tabIndex={0}
              onClick={() => setOpcao(o)} onKeyDown={(e) => e.key === 'Enter' && setOpcao(o)}>
              <span className="quarto-tile-icon">{o.icon}</span>
              <span className="quarto-tile-label">{o.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
