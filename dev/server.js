// In-memory Stride server for UI testing: node dev/server.js. Tokens are "uid|email" (see fake-firebase.js).
import http from 'node:http';
import { createHandler } from '../server/handler.js';
import { createMemoryStore } from '../server/memory-store.js';
import { seedClubs } from '../server/clubs.js';

// Test-only clubs so screens have something to show. Production clubs live in server/clubs.js.
const c = (id, name, type, day, time, when, short, lead, fee) => ({
  id, name, type, day, time, when, short, ages: 'Ages 12 to 17', range: '12–17', lead, session: 'Session', confirmer: 'Coach',
  note: 'Coaches confirm attendance.', about: `Weekly ${name.toLowerCase()} sessions with a checked leader.`, leaderEmail: id === 'chess' ? 'mo@example.com' : null,
  sessionFeeCents: fee, currency: 'USD', verified: id !== 'robotics'
});
seedClubs.push(
  c('chess', 'Chess and Debate Club', 'Study', 2, '4:00 pm', 'Tuesdays, 4:00 pm', 'Tue, 4:00 pm', 'Coach · Mo D.', 500),
  c('football', 'Football Academy', 'Sport', 6, '9:00 am', 'Saturdays, 9:00 am', 'Sat, 9:00 am', 'Coach · Test C.', 0),
  c('robotics', 'Robotics Lab', 'STEM', 5, '4:00 pm', 'Fridays, 4:00 pm', 'Fri, 4:00 pm', 'Mentor · Test R.', 300),
  c('choir', 'Community Choir', 'Arts', 4, '4:30 pm', 'Thursdays, 4:30 pm', 'Thu, 4:30 pm', 'Leader · Test L.', 0)
);

const store = createMemoryStore();
const handle = createHandler({
  store,
  verifyToken: async (t) => {
    const [uid, email] = t.split('|');
    return { uid, email, name: uid[0].toUpperCase() + uid.slice(1) };
  }
});
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.writeHead(204).end();
  if (req.url.startsWith('/dev/approve')) {
    // /dev/approve?uid=x marks that mentor approved, standing in for the Firebase console edit.
    return store.load().then(async (db) => {
      const uid = new URL(req.url, 'http://x').searchParams.get('uid');
      const u = Object.values(db?.users || {}).find((x) => x.uid === uid);
      if (u) await store.saveChanges({ users: { upsert: [{ ...u, approved: true }], remove: [] } });
      res.end('ok');
    });
  }
  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', async () => {
    const body = JSON.parse(raw || '{}');
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '') || null;
    const out = await handle({ method: body.method, args: body.args, token });
    res.writeHead(out.status, { 'Content-Type': 'application/json' }).end(JSON.stringify(out.body));
  });
}).listen(8788, () => console.log('dev api on 8788'));
