# Stride prototype

A mobile-first app that gives 12 to 17 year olds structured, supervised things to do: verified clubs, checked mentors and short lessons. A parent or guardian approves everything.

Built with React, Vite and a PWA service worker. Hash routing (`#/clubs`) means the front end runs on any static host. Teens, guardians and mentors each sign in with Google to their own view. Data lives in Firestore behind a small server that enforces who can see and change what.

## Run it

```bash
npm install
npm test                 # server rules and access control
npm run dev:api &        # in-memory API on :8788 (no Firebase needed)
npm run dev:fake         # the app on :5300 with a fake Google sign-in: open /?as=ann, /?as=tino ...
```

`dev:fake` swaps `src/firebase.js` for `dev/fake-firebase.js`, so `?as=<name>` signs in as that person. It exists for testing and screenshots only and is never part of the production build. To approve a test mentor, open `http://localhost:8788/dev/approve?uid=<name>`.

## Accounts and roles

Everyone signs in with Google. The first time, they pick a role. Nothing is pre-filled: the app starts empty.

| Role | How they get in | Can |
| --- | --- | --- |
| Guardian | Google, then "Parent or guardian" | Add teens, set permissions, approve clubs, pause, read every message |
| Teen | Their own Google account plus the 6 character code their guardian sees after adding them (single use) | Ask to join clubs, do lessons, message mentors, all within what their guardian allowed |
| Mentor or club leader | Google, then "Mentor or club leader". **Locked until you approve them.** | Confirm tasks, mark registers, publish lessons, message their teens (nicknames only) |

### Approving a mentor

In the Firebase console open Firestore, then `users`, find the mentor's document (role `mentor`) and set `approved` to `true`. Until then they see a "being checked" screen, teens can't see them, and they can't act. Mentors are the only people who can contact teens, so this step is the safeguarding check.

### Adding a club

Edit `server/clubs.js` and restart the server. Set `leaderEmail` to the leader's Google address: when they sign up as a mentor, the club becomes theirs. Set `verified: true` only for clubs Stride has actually checked, because it turns on the "Checked by Stride" badge.

## How it fits together

- **Browser** (Firebase Hosting, `stride-zw.web.app`): signs in with Firebase Auth (Google), then calls `POST /api/rpc` with the Google ID token.
- **Server** (Render, `server/chat-server.js`): verifies the token with the Firebase Admin SDK, runs `src/api/rules.js`, writes the rows that changed to Firestore, and sends back only the rows that person may see (`server/visibility.js`). It also serves the study guide chat (`POST /api/chat`, OpenRouter).
- **Firestore**: only the server reads or writes it (`firestore.rules` denies every browser). Collections are listed in `src/api/seed.js`.

Server environment variables: `FIREBASE_SERVICE_ACCOUNT` (the service account JSON, one line), `OPENROUTER_API_KEY`, optionally `OPENROUTER_MODEL` and `ALLOWED_ORIGIN`. The web build reads `VITE_API_URL` from `.env.production`.

## Routes

| Role | Tabs | Other routes |
| --- | --- | --- |
| Teen | `#/today`, `#/clubs` (Discover), `#/learn`, `#/mentor` | `#/swipe`, `#/chat/<mentorId>` |
| Guardian | `#/guardian` (Family), `#/clubs`, `#/messages`, `#/account` | `#/guardian/controls`, `#/chat/<teenId>/<mentorId>` (read-only) |
| Mentor | `#/dashboard`, `#/teens`, `#/inbox`, `#/lessons` | `#/lessons/new`, `#/lessons/<id>/edit`, `#/chat/<teenId>`, `#/mentor` (own profile) |
| Everyone | | `#/club/<id>`, `#/lesson/<id>`, `#/mentor/<id>`, `#/account` |

## Where things live

- `src/api/`: the data layer (backends, rules, selectors, seed)
- `server/`: the Render server (`chat-server.js`), the rules runner (`handler.js`), who-can-read-what (`visibility.js`), the Firestore store, and `clubs.js` (launch clubs)
- `firestore.rules`: denies every direct browser read and write
- `dev/`: the fake-Google test harness
- `src/screens/`: one file per screen. Mentor screens are in `src/screens/mentor/`, sign-up and sign-in in `src/screens/onboarding/`.
- `src/store.jsx`: per-device UI state only (filters, saved lessons, which teen a guardian is looking at)
- `src/data.js`: the club, lesson and mentor catalogue the seed is built from
- `src/styles.css`: design tokens at the top, then the styles for each part of the app

## Sample data

The names (Stride, Tino, Rudo, Fabulous Lashid) and the clubs are placeholders. Nothing here is real, and no impact numbers are claimed.

## Next steps

1. **Phone sign-in for guardians:** a one-time code by SMS or WhatsApp instead of a password.
2. **WhatsApp-first guardians:** approve by replying "YES". The server sends the weekly summary and respects quiet hours.
3. **QR check-in:** the leader shows a code and teens scan it, so the register fills itself and is harder to fake.
4. **Safeguarding tools for staff:** a reports queue, keyword flags in messages, and a way to vet and create mentor accounts.
5. **Shona and Ndebele, plus a low-data mode:** lessons download only on Wi-Fi, with compressed video.
6. **Lesson video upload** to Firebase Storage instead of pasting a link.
7. **A verified growth record** that schools and employers can check, and an impact dashboard for funders built from confirmed data.
