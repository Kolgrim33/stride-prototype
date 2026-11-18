// The server backend. One endpoint (POST /api/rpc) takes { method, args } plus a Firebase ID token,
// runs the rules, saves only the rows that changed, and sends back the slice of the database
// the signed-in user may see.
import { ApiError, applyMethod, methodNames } from '../src/api/rules.js';
import { collections, emptyDb } from '../src/api/seed.js';
import { seedClubs } from './clubs.js';
import { visibleTo } from './visibility.js';

const allowed = new Set(methodNames);

/** Rows to write and ids to delete, per collection. */
export function diff(prev, next) {
  const changes = {};
  for (const name of collections) {
    const before = prev[name] || {};
    const after = next[name] || {};
    const upsert = [];
    const remove = [];
    for (const [id, row] of Object.entries(after)) {
      if (!before[id] || JSON.stringify(before[id]) !== JSON.stringify(row)) upsert.push(row);
    }
    for (const id of Object.keys(before)) if (!after[id]) remove.push(id);
    if (upsert.length || remove.length) changes[name] = { upsert, remove };
  }
  return changes;
}

/**
 * @param {object} options
 * @param {object} options.store         firestore-store.js or memory-store.js
 * @param {(token: string) => Promise<{uid: string, email?: string, name?: string, picture?: string}>} options.verifyToken
 * @param {() => Date} [options.now]
 */
export function createHandler({ store, verifyToken, now = () => new Date() }) {
  async function loadDb() {
    const db = await store.load();
    if (db) return db;
    const seeded = emptyDb();
    for (const club of seedClubs) seeded.clubs[club.id] = club;
    await store.fillMissing(seeded);
    return (await store.load()) || seeded;
  }

  const userOf = (db, identity) => (identity ? Object.values(db.users).find((u) => u.uid === identity.uid) || null : null);

  const reply = (db, identity, extra = {}) => {
    const user = userOf(db, identity);
    return {
      status: 200,
      body: {
        ...extra,
        // `identity` lets the app greet someone who has signed in with Google but has no profile yet.
        snapshot: { db: visibleTo(db, user?.id), session: user ? { userId: user.id } : null, identity: identity ? { email: identity.email || null, name: identity.name || '', picture: identity.picture || null } : null }
      }
    };
  };

  return async function handle({ method, args = [], token } = {}) {
    try {
      let identity = null;
      if (token) {
        try {
          identity = await verifyToken(token);
        } catch {
          throw new ApiError('Your sign-in expired. Sign in again.', 401);
        }
      }
      const db = await loadDb();

      if (method === 'snapshot') return reply(db, identity);
      if (method === 'health') {
        const counts = Object.fromEntries(collections.map((c) => [c, Object.keys(db[c] || {}).length]));
        return { status: 200, body: { ok: true, counts } };
      }
      if (!allowed.has(method)) throw new ApiError(`Unknown action: ${method}`, 400);

      const next = structuredClone(db);
      const result = applyMethod(next, method, Array.isArray(args) ? args : [args], { identity, now: now() });
      const changes = diff(db, next);
      if (Object.keys(changes).length) await store.saveChanges(changes);
      return reply(next, identity, { value: result.value });
    } catch (error) {
      if (error instanceof ApiError) return { status: error.status, body: { error: error.message } };
      console.error('[stride] rpc failed', method, error);
      return { status: 500, body: { error: 'Something went wrong on our side. Try again in a moment.' } };
    }
  };
}
