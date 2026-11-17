// Tiny Node server for Render: POST /api/chat. Env: OPENROUTER_API_KEY, OPENROUTER_MODEL, ALLOWED_ORIGIN.
import http from 'node:http';
import { createAssistant } from './assistant.js';

const assist = createAssistant({ apiKey: process.env.OPENROUTER_API_KEY, model: process.env.OPENROUTER_MODEL || undefined });
const origins = (process.env.ALLOWED_ORIGIN || 'https://stride-zw.web.app,https://stride-zw.firebaseapp.com').split(',');
const hits = new Map(); // shortcut: per-instance memory limiter, move to Redis if this runs on several instances
const LIMIT = 20; // requests per IP per minute

http
  .createServer((req, res) => {
    const origin = origins.includes(req.headers.origin) ? req.headers.origin : origins[0];
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
    const send = (status, body) => (res.writeHead(status, { 'Content-Type': 'application/json' }), res.end(JSON.stringify(body)));
    if (req.method === 'OPTIONS') return send(204, {});
    if (req.url === '/health') return send(200, { ok: true });
    if (req.url !== '/api/chat' || req.method !== 'POST') return send(404, { error: 'Not found.' });
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress).split(',')[0].trim();
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter((t) => now - t < 60000);
    if (recent.length >= LIMIT) return send(429, { error: 'Slow down a little and try again.' });
    hits.set(ip, [...recent, now]);
    let raw = '';
    req.on('data', (c) => (raw += c) && raw.length > 20000 && req.destroy());
    req.on('end', async () => {
      let body;
      try {
        body = JSON.parse(raw || '{}');
      } catch {
        return send(400, { error: 'Bad request.' });
      }
      const out = await assist(body);
      send(out.status, out.body);
    });
  })
  .listen(process.env.PORT || 8787);
