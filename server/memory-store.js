// An in-memory store with the same shape as firestore-store.js, used by the tests.
export function createMemoryStore() {
  let db = null;
  return {
    async load() {
      return db ? structuredClone(db) : null;
    },
    async fillMissing(seed) {
      db ||= structuredClone(seed);
      for (const [name, rows] of Object.entries(seed)) {
        if (typeof rows !== 'object') continue;
        db[name] ||= {};
        for (const [id, row] of Object.entries(rows)) db[name][id] ||= structuredClone(row);
      }
    },
    async saveChanges(changes) {
      for (const [name, { upsert, remove }] of Object.entries(changes)) {
        for (const id of remove) delete db[name][id];
        for (const row of upsert) db[name][row.id] = structuredClone(row);
      }
    }
  };
}
