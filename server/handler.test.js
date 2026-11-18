import { beforeEach, describe, expect, it } from 'vitest';
import { createHandler, diff } from './handler.js';
import { createMemoryStore } from './memory-store.js';

const NOW = new Date(2026, 10, 10, 12, 0);
let handle;
let store;

// A fake token is "uid|email"; the real server verifies a Firebase ID token instead.
const verifyToken = async (token) => {
  const [uid, email] = token.split('|');
  if (!uid) throw new Error('bad');
  return { uid, email, name: uid };
};
const call = (token, method, ...args) => handle({ token, method, args });
const ok = async (...a) => {
  const res = await call(...a);
  expect(res.status, res.body.error).toBe(200);
  return res.body;
};
const dob = '2012-03-04';

beforeEach(() => {
  store = createMemoryStore();
  handle = createHandler({ store, verifyToken, now: () => NOW });
});

describe('sign-in with Google', () => {
  it('starts empty: no users, no demo rows', async () => {
    const { snapshot } = await ok(null, 'snapshot');
    expect(snapshot.session).toBe(null);
    for (const name of ['users', 'mentors', 'lessons', 'messages']) expect(Object.keys(snapshot.db[name])).toHaveLength(0);
  });

  it('rejects an expired or bad token', async () => {
    const res = await handle({ token: '', method: 'snapshot' });
    expect(res.status).toBe(200); // no token = signed out
    const bad = await handle({ token: '|x', method: 'snapshot' });
    expect(bad.status).toBe(401);
  });

  it('a new Google account has an identity but no profile until it picks a role', async () => {
    const { snapshot } = await ok('ann|ann@x.com', 'snapshot');
    expect(snapshot.session).toBe(null);
    expect(snapshot.identity.email).toBe('ann@x.com');
    const { snapshot: after } = await ok('ann|ann@x.com', 'registerGuardian', { name: 'Ann Moyo', relation: 'Mother' });
    expect(after.session.userId).toBeTruthy();
    expect((await call('ann|ann@x.com', 'registerGuardian', { name: 'Again' })).status).toBe(409);
  });

  it('never sends a Firebase uid to the browser', async () => {
    await ok('ann|ann@x.com', 'registerGuardian', { name: 'Ann Moyo' });
    const { snapshot } = await ok('ann|ann@x.com', 'snapshot');
    expect(Object.values(snapshot.db.users).some((u) => 'uid' in u)).toBe(false);
  });
});

describe('teens join with a code', () => {
  async function family() {
    await ok('ann|ann@x.com', 'registerGuardian', { name: 'Ann Moyo' });
    const { value: teenId } = await ok('ann|ann@x.com', 'createTeen', { name: 'Tino', dob });
    const { snapshot } = await ok('ann|ann@x.com', 'snapshot');
    return { teenId, code: snapshot.db.users[teenId].joinCode };
  }

  it('the guardian sees the code; the teen links their own Google account with it', async () => {
    const { teenId, code } = await family();
    expect(code).toMatch(/^[A-Z2-9]{6}$/);
    const { snapshot } = await ok('tino|', 'joinWithCode', code);
    expect(snapshot.session.userId).toBe(teenId);
    expect(snapshot.db.users[teenId].joinCode).toBeUndefined();
    expect((await call('eve|', 'joinWithCode', code)).status).toBe(404); // single use
  });

  it('another family cannot see this teen', async () => {
    const { teenId } = await family();
    await ok('bob|bob@x.com', 'registerGuardian', { name: 'Bob Ncube' });
    const { snapshot } = await ok('bob|bob@x.com', 'snapshot');
    expect(snapshot.db.users[teenId]).toBeUndefined();
  });

  it('rejects teens outside 12 to 17', async () => {
    await ok('ann|ann@x.com', 'registerGuardian', { name: 'Ann Moyo' });
    expect((await call('ann|ann@x.com', 'createTeen', { name: 'Baby', dob: '2020-01-01' })).status).toBe(400);
  });
});

describe('mentors need approval', () => {
  it('can sign up but cannot act until Stride approves them', async () => {
    await ok('mo|mo@x.com', 'registerMentor', { name: 'Mo Dube', role: 'Coach at Chess Club' });
    const res = await call('mo|mo@x.com', 'saveLesson', { title: 'x' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/checking your mentor account/);
    const { snapshot } = await ok(null, 'snapshot');
    expect(Object.keys(snapshot.db.mentors)).toHaveLength(0); // not public while pending
  });

  it('becomes public and active once approved', async () => {
    const { value: userId } = await ok('mo|mo@x.com', 'registerMentor', { name: 'Mo Dube', role: 'Coach at Chess Club' });
    const saved = await store.load();
    saved.users[userId].approved = true;
    await store.saveChanges({ users: { upsert: [saved.users[userId]], remove: [] } });
    const { snapshot } = await ok(null, 'snapshot');
    expect(Object.keys(snapshot.db.mentors)).toHaveLength(1);
  });
});

describe('diff', () => {
  it('finds changed, added and removed rows', () => {
    const a = { users: { u1: { id: 'u1', n: 1 }, u2: { id: 'u2' } } };
    const b = { users: { u1: { id: 'u1', n: 2 }, u3: { id: 'u3' } } };
    const d = diff(a, b).users;
    expect(d.upsert.map((r) => r.id).sort()).toEqual(['u1', 'u3']);
    expect(d.remove).toEqual(['u2']);
  });
});
