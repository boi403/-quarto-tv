-- Módulo "Quarto" do SignalCloud — canais, filmes e solicitações
-- Room service NÃO tem tabela nova aqui: reutiliza o sistema de pedidos
-- já existente (Node.js/Express/PostgreSQL/Socket.io/Mercado Pago).

CREATE TABLE IF NOT EXISTS quarto_tv_channels (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  logo_url      TEXT,
  stream_url    TEXT NOT NULL,          -- HLS (.m3u8) ou outra fonte suportada
  category      VARCHAR(60) DEFAULT 'Geral',
  sort_order    INTEGER DEFAULT 0,
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quarto_movies (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(160) NOT NULL,
  poster_url    TEXT,
  video_url     TEXT NOT NULL,
  synopsis      TEXT,
  duration_min  INTEGER,
  category      VARCHAR(60) DEFAULT 'Geral',
  sort_order    INTEGER DEFAULT 0,
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Solicitações do hóspede (toalhas, limpeza, manutenção, recepção etc.)
CREATE TABLE IF NOT EXISTS quarto_requests (
  id            SERIAL PRIMARY KEY,
  room_number   VARCHAR(10) NOT NULL,
  guest_name    VARCHAR(120),
  request_type  VARCHAR(60) NOT NULL,   -- ex: 'toalhas', 'limpeza', 'manutencao', 'recepcao', 'outro'
  message       TEXT,
  status        VARCHAR(20) DEFAULT 'pendente', -- pendente | em_andamento | concluido
  created_at    TIMESTAMPTZ DEFAULT now(),
  resolved_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_quarto_requests_status ON quarto_requests(status);
CREATE INDEX IF NOT EXISTS idx_quarto_channels_active ON quarto_tv_channels(active, sort_order);
CREATE INDEX IF NOT EXISTS idx_quarto_movies_active ON quarto_movies(active, sort_order);
