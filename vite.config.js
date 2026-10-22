import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // caminhos relativos: roda na raiz, numa subpasta (GitHub Pages) ou pelo IP do PC
  base: './',
  build: {
    // TVs Samsung Tizen (ex: T4300, 2020) usam um Chromium antigo no navegador
    target: 'es2017',
  },
  // --host: libera o acesso pelas TVs na rede do hotel
  // allowedHosts: true pq algumas Smart TVs mandam o header Host de um jeito
  // que o Vite não reconhece como IP e bloqueia com 403 "Forbidden"
  server: { host: true, port: 5188, allowedHosts: true },
  preview: { host: true, port: 8080, allowedHosts: true },
});
