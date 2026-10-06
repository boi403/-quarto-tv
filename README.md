# Módulo Quarto — SignalCloud

Novo módulo pra tela do quarto, inspirado no modelo Webspot: canais ao vivo,
filmes, room service e solicitações. Segue o mesmo padrão dos outros módulos
do SignalCloud (React + Node/Express + PostgreSQL, paleta dark/gold).

## O que é novo vs. o que reaproveita

- **Canais e Filmes** — tabelas e rotas novas (`quarto_tv_channels`, `quarto_movies`).
- **Room service** — **não duplica nada**. `RoomServiceScreen` só abre o sistema
  de pedidos que você já tem (Node/Express/PostgreSQL/Socket.io/Mercado Pago),
  passando o número do quarto. Configure a env `ROOM_SERVICE_GUEST_URL` apontando
  pro cardápio mobile já existente.
- **Solicitações** — tabela e rotas novas (`quarto_requests`), com o mesmo
  padrão de evento em tempo real (Socket.io) que o painel de room service já usa,
  pra aparecer no painel da recepção.

## Rodar nas TVs (sem banco)

```bash
npm install
npm run canais   # puxa e testa os canais do iptv-org (repita de tempos em tempos)
npm run tv       # gera e serve a tela na rede em http://IP-DO-PC:8080
```

- Todas as TVs abrem a mesma tela (Canais ao vivo e Filmes), sem número de quarto.
- **WhatsApp, opções do room service e solicitações**: `quarto.config.js`.
- O PC que roda `npm run tv` precisa ficar ligado e com IP fixo na rede.

## Integração

1. **Banco**: rode `backend/db/schema.sql` no Postgres do hotel.
2. **API**: em `server.js`, monte o router:
   ```js
   const quartoRouter = require('./routes/quarto');
   app.use('/api/quarto', quartoRouter(pool, io)); // io é o mesmo do room service
   ```
3. **Env**: adicione `ROOM_SERVICE_GUEST_URL=https://roomservice.seuhotel.com/menu`
4. **Frontend**: `HomeScreen.jsx` é o ponto de entrada — renderize ele recebendo
   `room` (número do quarto + nome do hóspede, vindo do PMS no check-in, igual
   já acontece na sinalização) e `hotelName`.
5. **Kotlin WebView shell**: aponte a WebView pra rota que serve `HomeScreen`
   (ex: `https://tv.seuhotel.com/quarto?token=...`), do mesmo jeito que já
   faz com a sinalização.

## Contrato de dados

### `GET /api/quarto/channels`
```json
[{ "id": 1, "name": "Globo", "logo_url": "...", "stream_url": "https://.../index.m3u8", "category": "Aberta" }]
```

### `GET /api/quarto/movies`
```json
[{ "id": 1, "title": "...", "poster_url": "...", "video_url": "...", "synopsis": "...", "duration_min": 110, "category": "..." }]
```

### `GET /api/quarto/room-service/link?room=305`
```json
{ "url": "https://roomservice.seuhotel.com/menu?quarto=305" }
```

### `POST /api/quarto/requests`
```json
{ "room_number": "305", "guest_name": "Mateus", "request_type": "toalhas", "message": null }
```
Emite `quarto:new_request` via Socket.io pro painel da recepção.

### `GET /api/quarto/requests?status=pendente` — pro painel da recepção
### `PATCH /api/quarto/requests/:id/status` — `{ "status": "concluido" }`

## Cadastro de canais e filmes

Não veio um painel admin novo neste módulo — dá pra inserir direto via SQL
por enquanto, ou reaproveitar o padrão de CRUD que o admin React do
SignalCloud já usa pra sinalização (mesma estrutura de tabela/formulário).

## Player de vídeo

`ChannelsScreen` usa `hls.js` pra tocar streams `.m3u8`. Adicione a dependência:
```bash
npm install hls.js
```

## Pendências de design pra você decidir

- Ícones dos tiles estão como emoji (placeholder) — trocar pelos ícones do
  seu design system, se já tiver um pro PMS/sinalização.
- `RequestsScreen` está com 4 tipos rápidos fixos — ajuste a lista pro que
  faz sentido pro seu hotel (ex: adicionar "Ar-condicionado", "Wi-Fi").
