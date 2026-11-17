// Vercel function: POST /api/chat { messages, context }. Needs OPENROUTER_API_KEY (and optionally OPENROUTER_MODEL).
import { createAssistant } from '../server/assistant.js';

const assist = createAssistant({ apiKey: process.env.OPENROUTER_API_KEY, model: process.env.OPENROUTER_MODEL || undefined });

export default async function chat(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const { status, body: out } = await assist(body);
  res.status(status).json(out);
}
