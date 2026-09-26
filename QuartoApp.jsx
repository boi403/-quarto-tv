import React, { useState } from 'react';
import './theme.css';
import HomeScreen from './HomeScreen';

// Identifica o quarto desta TV.
// 1) Se a URL tiver ?quarto=305, usa e memoriza.
// 2) Senão, usa o que a TV já memorizou.
// 3) Senão, mostra a tela de configuração (uma vez por TV).
// Pra reconfigurar uma TV: abra a URL com ?configurar=1
const CHAVE = 'quarto-numero';

function lerSalvo() {
  try { return localStorage.getItem(CHAVE); } catch { return null; }
}
function salvar(numero) {
  try { localStorage.setItem(CHAVE, numero); } catch { /* sem storage: vale só nesta sessão */ }
}

function quartoInicial() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('configurar')) return null;
  const daUrl = params.get('quarto');
  if (daUrl) { salvar(daUrl); return daUrl; }
  return lerSalvo();
}

export default function QuartoApp() {
  const [numero, setNumero] = useState(quartoInicial);
  const [digitado, setDigitado] = useState(lerSalvo() || '');

  if (!numero) {
    const confirmar = () => {
      const n = digitado.trim();
      if (!n) return;
      salvar(n);
      // tira o ?configurar da URL pra não cair aqui de novo
      window.history.replaceState(null, '', window.location.pathname);
      setNumero(n);
    };
    return (
      <div className="quarto-root">
        <header className="quarto-header">
          <span className="quarto-brand-wrap">
            <img className="quarto-logo" src={`${import.meta.env.BASE_URL}logo-transparente.png`} alt="" />
            <span className="quarto-brand">Configurar esta TV</span>
          </span>
        </header>
        <div className="quarto-config">
          <label htmlFor="numero-quarto">Número do quarto</label>
          <input
            id="numero-quarto"
            inputMode="numeric"
            autoFocus
            value={digitado}
            onChange={(e) => setDigitado(e.target.value.replace(/\D/g, '').slice(0, 5))}
            onKeyDown={(e) => e.key === 'Enter' && confirmar()}
          />
          <button className="quarto-back" onClick={confirmar} disabled={!digitado.trim()}>
            Salvar
          </button>
          <p className="quarto-tile-sub">Use os números do controle remoto e confirme com OK.</p>
        </div>
      </div>
    );
  }

  return <HomeScreen room={{ number: numero }} />;
}
