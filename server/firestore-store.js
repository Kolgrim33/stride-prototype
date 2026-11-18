// Keeps the database in Firestore. Only this server talks to it (through the Admin SDK), and the
// Firestore security rules deny every direct browser read and write, so each request goes through
// handler.js, which applies the rules and sends each person only the rows they may see.
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { DB_VERSION, collections, emptyDb } from '../src/api/seed.js';

const BATCH = 400;

export function firestoreConfigured(env = process.env) {
  return !!env.FIREBASE_SERVICE_ACCOUNT;
}

export function createFirestoreStore(env = process.env) {
  const app = getApps()[0] || initializeApp({ credential: cert(JSON.parse(env.FIREBASE_SERVICE_ACCOUNT)) });
  const fs = getFirestore(app);

  async function commit(ops) {
    for (let i = 0; i < ops.length; i += BATCH) {
      const batch = fs.batch();
      for (const op of ops.slice(i, i + BATCH)) op(batch);
      await batch.commit();
    }
  }

  return {
    async load() {
      const db = emptyDb();
      db.version = DB_VERSION;
      const snaps = await Promise.all(collections.map((name) => fs.collection(name).get()));
      collections.forEach((name, i) => snaps[i].forEach((doc) => (db[name][doc.id] = doc.data())));
      return db;
    },
    // Create-only, so a restart never overwrites a club someone has since edited.
    async fillMissing(seed) {
      const ops = [];
      for (const name of collections) {
        for (const [id, row] of Object.entries(seed[name] || {})) {
          ops.push((b) => b.create(fs.collection(name).doc(id), row));
        }
      }
      for (const op of ops) await commit([op]).catch((e) => e.code === 6 || /ALREADY_EXISTS/.test(String(e.message)) || Promise.reject(e));
    },
    async saveChanges(changes) {
      const ops = [];
      for (const [name, { upsert, remove }] of Object.entries(changes)) {
        for (const row of upsert) ops.push((b) => b.set(fs.collection(name).doc(row.id), row));
        for (const id of remove) ops.push((b) => b.delete(fs.collection(name).doc(id)));
      }
      await commit(ops);
    }
  };
}
