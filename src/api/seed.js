// The shape of the database. It starts empty: every user, club and lesson is a real row,
// created by a real person signing in with Google. Nothing here is sample data.
export const DB_VERSION = 5;

export const teenColors = ['#b4533f', '#2f6f63', '#6a5a8a', '#a87632', '#2c5784', '#94506a'];

export const collections = ['users', 'mentors', 'clubs', 'lessons', 'memberships', 'requests', 'attendance', 'tasks', 'badges', 'messages', 'reports', 'ledger'];

export function emptyDb() {
  return { version: DB_VERSION, ...Object.fromEntries(collections.map((c) => [c, {}])) };
}
