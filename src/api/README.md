# Data layer

`src/api/` is the only code that touches data. Screens call `useBackend()` and get `{ db, session, identity, user, api }`.

| File | What it does |
| --- | --- |
| `index.jsx` | `BackendProvider`, `useBackend()` and `attempt()` |
| `remote.js` | Signs in with Google (`api.signInWithGoogle()`), attaches the Firebase ID token to every call, polls every 20 seconds |
| `rules.js` | Every write and its access rules. Throws `ApiError` with a message a person can read. Runs on the server |
| `selectors.js` | Pure read helpers over a snapshot |
| `seed.js` | Collection names, `emptyDb()`, teen colours. There is no sample data |
| `dates.js` | Calendar-day helpers. Weeks run Monday to Sunday |
| `../../server/handler.js` | Verifies the token, runs one rule on a copy of the database, saves only the changed rows, returns the rows this person may see |
| `../../server/visibility.js` | The read half of the access rules |
| `../../server/firestore-store.js` | Firestore through the Admin SDK |

## How a call works

1. A screen calls `api.requestClub('chess')`.
2. `remote.js` posts `{ method, args }` to `/api/rpc` with `Authorization: Bearer <Google ID token>`.
3. The server verifies the token, finds the user who owns that Google `uid`, and runs the rule from `rules.js` on a copy of the database. A broken rule throws `ApiError`; `attempt(promise)` turns it into a message the screen shows inline.
4. Changed rows are written to Firestore. The reply is the signed-in person's slice of the database.

`server/handler.test.js` is the spec: sign-in, join codes, mentor approval and what each person can see.

## Schema

Each collection is an object keyed by `id` in the browser and a Firestore collection on the server.

| Collection | Key fields |
| --- | --- |
| `users` | `role, uid (server only), name, email`. Teen: `surname, nickname, dob, guardianId, mentorId, joinCode (until they join), color, interests, goal, routine, paused, quietHours, consent, consentLog`. Mentor: `mentorId, approved` |
| `mentors` | public profile: `userId, name, first, short, initials, role, bio` |
| `clubs` | catalogue fields, `mentorId` (the leader), `leaderEmail` (server only), `verified`, optional `cost` |
| `lessons` | `mentorId, club, steps, badge, image, videoUrl, createdAt` |
| `memberships` | `teenId, clubId, since, requestId` |
| `requests` | `teenId, clubId, status (pending, approved, declined), createdAt, decidedAt, decidedBy` |
| `attendance` | `teenId, clubId, date, confirmedBy, at` |
| `tasks` | `teenId, lessonId, steps, status (draft, submitted, confirmed, returned), submittedAt, reviewedAt, reviewedBy, note` |
| `badges` | `teenId, name, mentorId, clubId, lessonId, at` |
| `messages` | `teenId, mentorId, from (teen or mentor), text, at, readAt` |
| `reports` | `by, role, teenId, mentorId, reason, text, at, status` |

## Security

- Browsers never reach Firestore: `firestore.rules` denies everything and only the server (Admin SDK) reads and writes.
- The server trusts only a verified Firebase ID token. The Firebase `uid` never leaves the server.
- `visibility.js` decides what each person receives: a guardian gets only their own family; a mentor gets their own threads and nickname-only rows for their mentees and club members; mentors who aren't approved are invisible to everyone else.
- Mentors can't act until `approved` is true on their user document.
- Join codes are single use and cleared when the teen joins.

## Known limits

- Each request reads every collection, then writes only what changed. Fine for a pilot of hundreds of families; for more, move reads to targeted queries using `handler.test.js` as the spec.
- Writes to several rows aren't one transaction, so two people editing the same row at the same moment means last write wins.
- Dates use the server's clock (UTC). Close to midnight in Harare, "today" can still be yesterday.
- New messages arrive by polling every 20 seconds.
- Google accounts require users to be 13 or older (younger needs Family Link). Teen accounts here are 12 to 17, so a 12 year old needs a supervised Google account.
