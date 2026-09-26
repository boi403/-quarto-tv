// Cliente simples pro módulo Quarto. Padrão: relativo ao site (funciona no
// GitHub Pages e no `npm run tv`). No SignalCloud, defina VITE_API_BASE=/api/quarto.
const API_BASE = import.meta.env.VITE_API_BASE || `${import.meta.env.BASE_URL}api/quarto`;

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erro ${res.status}`);
  }
  return res.json();
}

export const quartoApi = {
  getChannels: () => request('/channels'),
  getMovies: () => request('/movies'),
  getRoomServiceLink: (room) => request(`/room-service/link?room=${encodeURIComponent(room)}`),
  sendRequest: (payload) =>
    request('/requests', { method: 'POST', body: JSON.stringify(payload) }),
};
