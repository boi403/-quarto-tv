// Rotas do módulo "Quarto" — monte com: app.use('/api/quarto', quartoRouter)
// Espera um pool do 'pg' injetado (mesmo padrão dos outros módulos do SignalCloud).
// Se você já tem um io (Socket.io) para o painel da recepção, injete-o também
// para emitir eventos em tempo real nas solicitações, do mesmo jeito que faz
// no room service.

const express = require('express');

module.exports = function quartoRouter(pool, io) {
  const router = express.Router();

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
  router.get('/room-service/link', (req, res) => {
    const { room } = req.query;
    const baseUrl = process.env.ROOM_SERVICE_GUEST_URL; // ex: https://roomservice.araguaiahotel.com/menu
    if (!baseUrl) {
      return res.status(500).json({ error: 'ROOM_SERVICE_GUEST_URL não configurada.' });
    }
    const url = room ? `${baseUrl}?quarto=${encodeURIComponent(room)}` : baseUrl;
    res.json({ url });
  });

  // ---------- Solicitações do hóspede ----------
  router.post('/requests', async (req, res) => {
    const { room_number, guest_name, request_type, message } = req.body;
    if (!room_number || !request_type) {
      return res.status(400).json({ error: 'room_number e request_type são obrigatórios.' });
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
  router.get('/requests', async (req, res) => {
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

  router.patch('/requests/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'pendente' | 'em_andamento' | 'concluido'
    if (!['pendente', 'em_andamento', 'concluido'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido.' });
    }
    try {
      const resolvedAt = status === 'concluido' ? 'now()' : 'NULL';
      const { rows } = await pool.query(
        `UPDATE quarto_requests SET status = $1, resolved_at = ${resolvedAt}
         WHERE id = $2 RETURNING *`,
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
