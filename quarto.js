// Rotas do módulo "Quarto" — monte com: app.use('/api/quarto', quartoRouter(pool, io, options))
// Espera um pool do 'pg' injetado (mesmo padrão dos outros módulos do SignalCloud).
// Se você já tem um io (Socket.io) para o painel da recepção, injete-o também
// para emitir eventos em tempo real nas solicitações, do mesmo jeito que faz
// no room service.
//
// options.requireStaffAuth — middleware Express para proteger o painel da
// recepção (GET/PATCH /requests). Por padrão exige um Bearer token igual a
// process.env.QUARTO_STAFF_TOKEN. Este repo não tem o restante do backend do
// SignalCloud, então não dá pra reaproveitar o middleware real de sessão de
// staff diretamente — em produção, passe aqui o MESMO middleware de
// auth/sessão que os outros painéis (room service etc.) já usam:
//   quartoRouter(pool, io, { requireStaffAuth: suaAuthDeStaffExistente })
//
// options.verifyRoomRequest — função opcional `(req, roomNumber) => boolean`
// (ou Promise) pra confirmar que quem está chamando POST /requests ou
// GET /room-service/link é realmente aquele quarto (ex.: validar o mesmo
// `?token=...` de sessão do quarto usado pela WebView). Sem isso, essas
// rotas continuam aceitando o room_number informado pelo cliente — o rate
// limit abaixo reduz o abuso, mas não substitui essa validação.

const express = require('express');

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;

function defaultStaffAuth(req, res, next) {
  const expected = process.env.QUARTO_STAFF_TOKEN;
  if (!expected) {
    // Fail-closed: sem token configurado, o painel da recepção fica bloqueado
    // em vez de aberto — nunca liberar por falta de configuração.
    console.error(
      'QUARTO_STAFF_TOKEN não configurado — bloqueando painel da recepção por padrão. ' +
      'Configure a env ou injete options.requireStaffAuth com a auth real de staff.'
    );
    return res.status(503).json({ error: 'Autenticação da recepção não configurada.' });
  }
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token || token !== expected) {
    return res.status(401).json({ error: 'Não autorizado.' });
  }
  next();
}

async function defaultVerifyRoomRequest() {
  // Sem mecanismo de sessão de quarto configurado neste módulo isoladamente —
  // ver nota de options.verifyRoomRequest no topo do arquivo.
  return true;
}

function createRateLimiter({ windowMs, max }) {
  const hitsByKey = new Map();
  return function rateLimit(req, res, next) {
    const key = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const hits = (hitsByKey.get(key) || []).filter((t) => now - t < windowMs);
    hits.push(now);
    hitsByKey.set(key, hits);
    if (hits.length > max) {
      return res.status(429).json({ error: 'Muitas solicitações. Tente novamente em alguns instantes.' });
    }
    next();
  };
}

module.exports = function quartoRouter(pool, io, options = {}) {
  const router = express.Router();
  const requireStaffAuth = options.requireStaffAuth || defaultStaffAuth;
  const verifyRoomRequest = options.verifyRoomRequest || defaultVerifyRoomRequest;
  const requestsRateLimit = createRateLimiter({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX_REQUESTS,
  });

  // ---------- Canais ao vivo ----------
  router.get('/channels', async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT id, name, logo_url, stream_url, category
         FROM quarto_tv_channels
         WHERE active = true
         ORDER BY sort_order ASC, name ASC`
      );
      res.json(rows);
    } catch (err) {
      console.error('Erro ao listar canais:', err);
      res.status(500).json({ error: 'Não foi possível carregar os canais.' });
    }
  });

  // ---------- Filmes ----------
  router.get('/movies', async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT id, title, poster_url, video_url, synopsis, duration_min, category
         FROM quarto_movies
         WHERE active = true
         ORDER BY sort_order ASC, title ASC`
      );
      res.json(rows);
    } catch (err) {
      console.error('Erro ao listar filmes:', err);
      res.status(500).json({ error: 'Não foi possível carregar os filmes.' });
    }
  });

  // ---------- Room service ----------
  // Não duplica o sistema existente: só devolve a URL do menu já pronto,
  // pra tela do quarto abrir/embutir (Kotlin WebView shell) ou redirecionar.
  router.get('/room-service/link', async (req, res) => {
    const { room } = req.query;
    const baseUrl = process.env.ROOM_SERVICE_GUEST_URL; // ex: https://roomservice.seuhotel.com/menu
    if (!baseUrl) {
      return res.status(500).json({ error: 'ROOM_SERVICE_GUEST_URL não configurada.' });
    }
    if (room) {
      const allowed = await verifyRoomRequest(req, room);
      if (!allowed) {
        return res.status(403).json({ error: 'Quarto não confirmado para esta sessão.' });
      }
    }
    const url = room ? `${baseUrl}?quarto=${encodeURIComponent(room)}` : baseUrl;
    res.json({ url });
  });

  // ---------- Solicitações do hóspede ----------
  router.post('/requests', requestsRateLimit, async (req, res) => {
    const { room_number, guest_name, request_type, message } = req.body;
    if (!room_number || !request_type) {
      return res.status(400).json({ error: 'room_number e request_type são obrigatórios.' });
    }
    const allowed = await verifyRoomRequest(req, room_number);
    if (!allowed) {
      return res.status(403).json({ error: 'Quarto não confirmado para esta sessão.' });
    }
    try {
      const { rows } = await pool.query(
        `INSERT INTO quarto_requests (room_number, guest_name, request_type, message)
         VALUES ($1, $2, $3, $4)
         RETURNING id, room_number, request_type, status, created_at`,
        [room_number, guest_name || null, request_type, message || null]
      );
      const created = rows[0];
      if (io) io.emit('quarto:new_request', created); // mesmo padrão do painel de room service
      res.status(201).json(created);
    } catch (err) {
      console.error('Erro ao criar solicitação:', err);
      res.status(500).json({ error: 'Não foi possível enviar a solicitação.' });
    }
  });

  // Painel da recepção: listar solicitações pendentes/andamento
  router.get('/requests', requireStaffAuth, async (req, res) => {
    const { status } = req.query;
    try {
      const { rows } = await pool.query(
        status
          ? `SELECT * FROM quarto_requests WHERE status = $1 ORDER BY created_at DESC`
          : `SELECT * FROM quarto_requests ORDER BY created_at DESC LIMIT 100`,
        status ? [status] : []
      );
      res.json(rows);
    } catch (err) {
      console.error('Erro ao listar solicitações:', err);
      res.status(500).json({ error: 'Não foi possível carregar as solicitações.' });
    }
  });

  router.patch('/requests/:id/status', requireStaffAuth, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'pendente' | 'em_andamento' | 'concluido'
    if (!['pendente', 'em_andamento', 'concluido'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido.' });
    }
    try {
      const { rows } = await pool.query(
        `UPDATE quarto_requests
            SET status = $1,
                resolved_at = CASE WHEN $1 = 'concluido' THEN now() ELSE NULL END
          WHERE id = $2
          RETURNING *`,
        [status, id]
      );
      if (io) io.emit('quarto:request_updated', rows[0]);
      res.json(rows[0]);
    } catch (err) {
      console.error('Erro ao atualizar solicitação:', err);
      res.status(500).json({ error: 'Não foi possível atualizar a solicitação.' });
    }
  });

  return router;
};
