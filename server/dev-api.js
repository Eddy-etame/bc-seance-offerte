import '../lib/load-env.js';
import http from 'node:http';
import { createServer } from 'vite';
import inscrire from '../api/inscrire.js';
import cronRelances from '../api/cron-relances.js';
import relanceCheck from '../api/internal/relance-check.js';

const PORT = Number(process.env.API_PORT || 5611);
const WITH_VITE = process.argv.includes('--vite');

const routes = [
  { method: 'POST', test: (p) => p === '/api/inscrire' || p.startsWith('/api/inscrire?'), handler: inscrire },
  { method: 'OPTIONS', test: (p) => p.startsWith('/api/inscrire'), handler: inscrire },
  { method: 'GET', test: (p) => p.startsWith('/api/cron-relances'), handler: cronRelances },
  { method: 'POST', test: (p) => p.startsWith('/api/cron-relances'), handler: cronRelances },
  { method: 'POST', test: (p) => p.startsWith('/api/internal/relance-check'), handler: relanceCheck },
];

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/health' || url.pathname === '/api/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, service: 'seance-offerte-api' }));
    return;
  }
  const route = routes.find((r) => r.method === req.method && r.test(url.pathname));
  if (!route) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: 'not_found' }));
    return;
  }
  try {
    await route.handler(req, res);
  } catch (err) {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
  }
});

server.listen(PORT, '127.0.0.1', async () => {
  console.log(`API séance offerte → http://127.0.0.1:${PORT}`);
  if (!WITH_VITE) return;
  const vite = await createServer({
        server: {
      port: 5610,
      host: '127.0.0.1',
      strictPort: true,
      proxy: {
        '/api': `http://127.0.0.1:${PORT}`,
      },
    },
  });
  await vite.listen();
  vite.printUrls();
});
