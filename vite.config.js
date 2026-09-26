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
  server: { host: true, port: 5188 },
  preview: { host: true, port: 8080 },
});
