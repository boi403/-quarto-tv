// Importa canais da lista pública do iptv-org (github.com/iptv-org/iptv),
// testa cada stream e guarda só os que respondem.
//
//   node dev/importar-canais.mjs            -> Brasil (padrão)
//   node dev/importar-canais.mjs br pt us   -> vários países
//
// Gera:
//   public/api/quarto/channels e movies -> lista usada pela tela (servida como arquivo)
//   public/quarto.m3u    -> playlist pros apps de IPTV da TV (Smart IPTV, VLC)
//   dev/canais-seed.sql  -> INSERTs pra quarto_tv_channels (ao vivo) e quarto_movies (filmes/séries)
import { mkdir, writeFile } from 'node:fs/promises';

const PAISES = process.argv.slice(2).length ? process.argv.slice(2) : ['br'];
const TIMEOUT_MS = 8000;
const CONCORRENCIA = 25;
// TV de hotel: fora conteúdo adulto
const GRUPOS_BLOQUEADOS = /xxx|adult/i;
// Categorias que vão pra tela "Filmes"; o resto fica em "Canais ao vivo"
const CATEGORIAS_FILMES = /^(movies|series|classic)$/i;

function parseM3u(texto) {
  const linhas = texto.split(/\r?\n/);
  const canais = [];
  for (let i = 0; i < linhas.length; i++) {
    if (!linhas[i].startsWith('#EXTINF')) continue;
    const info = linhas[i];
    let j = i + 1;
    while (j < linhas.length && (linhas[j].startsWith('#') || !linhas[j].trim())) j++;
    const url = linhas[j]?.trim();
    if (!url) continue;
    const attr = (k) => info.match(new RegExp(`${k}="([^"]*)"`))?.[1] || null;
    const nome = info.slice(info.lastIndexOf(',') + 1)
      .replace(/\s*\(\d+p\)/g, '')
      .replace(/\s*\[[^\]]*\]/g, '')
      .trim();
    canais.push({
      name: nome,
      logo_url: attr('tvg-logo'),
      stream_url: url,
      category: (attr('group-title') || 'Geral').split(';')[0],
    });
  }
  return canais;
}

async function streamFunciona(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow' });
    if (!res.ok) return false;
    const corpo = await res.text();
    return corpo.includes('#EXTM3U') || corpo.includes('#EXTINF');
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

async function emLotes(itens, fn, n) {
  const saida = new Array(itens.length);
  let proximo = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (proximo < itens.length) {
      const i = proximo++;
      saida[i] = await fn(itens[i], i);
    }
  }));
  return saida;
}

const sql = (v) => (v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);

let todos = [];
for (const pais of PAISES) {
  const res = await fetch(`https://iptv-org.github.io/iptv/countries/${pais}.m3u`);
  if (!res.ok) { console.error(`Lista de "${pais}" não encontrada (${res.status}).`); continue; }
  const lista = parseM3u(await res.text()).filter((c) => !GRUPOS_BLOQUEADOS.test(c.category));
  console.log(`${pais}: ${lista.length} canais na lista`);
  todos.push(...lista);
}

// remove duplicados pela URL
todos = [...new Map(todos.map((c) => [c.stream_url, c])).values()];

let testados = 0;
const ok = await emLotes(todos, async (c) => {
  const vivo = await streamFunciona(c.stream_url);
  testados++;
  if (testados % 25 === 0) process.stdout.write(`  testados ${testados}/${todos.length}\r`);
  return vivo;
}, CONCORRENCIA);

const funcionando = todos
  .filter((_, i) => ok[i])
  .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  .map((c, i) => ({ id: i + 1, ...c }));

const soHttp = funcionando.filter((c) => c.stream_url.startsWith('http://')).length;

const aoVivo = funcionando.filter((c) => !CATEGORIAS_FILMES.test(c.category));
const filmes = funcionando.filter((c) => CATEGORIAS_FILMES.test(c.category));

// Respostas "prontas" da API em public/ — assim a tela funciona em qualquer
// servidor estático, sem banco. Com o backend real, as rotas do quarto.js
// respondem no lugar desses arquivos.
// Playlist M3U pros apps de IPTV da TV (Smart IPTV / SIPTV, VLC...):
// grupos em português, filmes/séries num grupo só.
const GRUPOS_PT = {
  News: 'Notícias', Sports: 'Esportes', Kids: 'Infantil', Animation: 'Infantil',
  Religious: 'Religiosos', Education: 'Educação', Music: 'Música', Documentary: 'Documentários',
  Entertainment: 'Entretenimento', Comedy: 'Entretenimento', Culture: 'Cultura',
  Legislative: 'Governo', Cooking: 'Culinária', Travel: 'Viagem', Outdoor: 'Rural e natureza',
};
const grupo = (c) => (CATEGORIAS_FILMES.test(c.category) ? 'Filmes e séries' : GRUPOS_PT[c.category] || 'Variedades');
const ORDEM = ['Notícias', 'Esportes', 'Entretenimento', 'Filmes e séries', 'Infantil'];
const peso = (g) => (ORDEM.includes(g) ? ORDEM.indexOf(g) : ORDEM.length);
const m3u = '#EXTM3U\n' + [...funcionando]
  .sort((a, b) => peso(grupo(a)) - peso(grupo(b)) || grupo(a).localeCompare(grupo(b), 'pt-BR'))
  .map((c) => `#EXTINF:-1 tvg-logo="${c.logo_url || ''}" group-title="${grupo(c)}",${c.name}\n${c.stream_url}`)
  .join('\n') + '\n';
await writeFile(new URL('../public/quarto.m3u', import.meta.url), m3u);

const pastaApi = new URL('../public/api/quarto/', import.meta.url);
await mkdir(pastaApi, { recursive: true });
await writeFile(new URL('channels', pastaApi), JSON.stringify(aoVivo));
await writeFile(new URL('movies', pastaApi), JSON.stringify(filmes.map((c) => ({
  id: c.id,
  title: c.name,
  poster_url: c.logo_url,
  video_url: c.stream_url,
  synopsis: `Canal de ${/series/i.test(c.category) ? 'séries' : 'filmes'} 24h`,
  category: c.category,
  is_channel: true,
}))));
await writeFile(new URL('./canais-seed.sql', import.meta.url),
  `-- Gerado por dev/importar-canais.mjs em ${new Date().toISOString()}\n` +
  `-- Fonte: iptv-org (${PAISES.join(', ')}) — ${funcionando.length} canais respondendo no teste\n\n` +
  `-- Canais ao vivo\n` +
  aoVivo.map((c, i) =>
    `INSERT INTO quarto_tv_channels (name, logo_url, stream_url, category, sort_order) VALUES (${sql(c.name)}, ${sql(c.logo_url)}, ${sql(c.stream_url)}, ${sql(c.category)}, ${i});`
  ).join('\n') +
  `\n\n-- Canais de filmes/séries (tela Filmes)\n` +
  filmes.map((c, i) =>
    `INSERT INTO quarto_movies (title, poster_url, video_url, category, sort_order) VALUES (${sql(c.name)}, ${sql(c.logo_url)}, ${sql(c.stream_url)}, ${sql(c.category)}, ${i});`
  ).join('\n') + '\n');

console.log(`\nFuncionando: ${funcionando.length} de ${todos.length}`);
console.log(`Ao vivo: ${aoVivo.length} | Filmes/séries: ${filmes.length}`);
console.log(`Desses, ${soHttp} são http:// (sem https) — em página https o navegador bloqueia, precisam de proxy.`);
