import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './theme.css';
import { WHATSAPP_RECEPCAO, formatarTelefone, linkWhatsApp } from './quarto.config';

// Tela de "escaneie com o celular": o hóspede aponta a câmera e o WhatsApp
// abre com a mensagem já escrita (quarto + nome), é só tocar em enviar.
export default function QrWhatsApp({ opcao, room, onVoltar }) {
  const url = linkWhatsApp(opcao, room);
  return (
    <div className="quarto-qr">
      <div className="quarto-qr-code">
        <QRCodeSVG value={url} size={260} level="M" marginSize={2} />
      </div>
      <div className="quarto-qr-texto">
        <span className="quarto-tile-icon">{opcao.icon}</span>
        <h2>{opcao.label}</h2>
        <ol>
          <li>Abra a câmera do celular</li>
          <li>Aponte para o código ao lado</li>
          <li>O WhatsApp abre com a mensagem pronta — é só enviar</li>
        </ol>
        <p className="quarto-tile-sub">
          WhatsApp {formatarTelefone(opcao.whatsapp || WHATSAPP_RECEPCAO)}
        </p>
        <button className="quarto-back" onClick={onVoltar} autoFocus>← Voltar às opções</button>
      </div>
    </div>
  );
}
