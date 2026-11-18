// The data layer as the browser sees it. Every call goes to POST /api/rpc with the user's Firebase
// ID token. The server checks the token, runs the rules and sends back only what this person may see.
import { API_URL, auth, googleSignIn, googleSignOut, onIdTokenChanged } from '../firebase.js';
import { ApiError, methodNames } from './rules.js';

const POLL_MS = 20000;
const empty = { db: null, session: null, identity: null };

export function createRemoteBackend({ endpoint = `${API_URL}/api/rpc`, fetchImpl = (...a) => fetch(...a) } = {}) {
  let snapshot = { ...empty, ready: false, error: null };
  const listeners = new Set();
  const publish = (next) => {
    snapshot = next;
    listeners.forEach((fn) => fn());
  };

  // Replies can arrive out of order (a slow poll finishing after a sign-up). Only the newest request may publish.
  let sent = 0;
  let applied = 0;

  async function call(method, args = []) {
    const seq = ++sent;
    const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
    let response;
    try {
      response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ method, args })
      });
    } catch {
      throw new ApiError("Can't reach Stride. Check your connection and try again.", 0);
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      // The account already has a profile, so this screen is out of date: reload the real state and move on.
      if (response.status === 409 && /already has a Stride profile/.test(body.error || '')) api.refresh();
      throw new ApiError(body.error || 'Something went wrong. Try again.', response.status);
    }
    if (body.snapshot && seq > applied) {
      applied = seq;
      publish({ ...body.snapshot, ready: true, error: null });
    }
    return body.value;
  }

  const api = {
    getSnapshot: () => snapshot,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    async refresh() {
      try {
        await call('snapshot');
      } catch (error) {
        publish({ ...snapshot, ready: !!snapshot.db, error: error.message });
      }
      return snapshot;
    },
    async signInWithGoogle() {
      try {
        await googleSignIn();
      } catch (error) {
        if (['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(error.code)) return;
        throw new ApiError(error.code === 'auth/popup-blocked' ? 'Your browser blocked the Google window. Allow pop-ups for this site and try again.' : "Google sign-in didn't work. Try again.", 0);
      }
    },
    async signOut() {
      await googleSignOut();
      publish({ ...empty, db: snapshot.db && { ...snapshot.db, users: {} }, ready: true, error: null });
      await api.refresh();
    }
  };
  for (const name of methodNames) api[name] = (...args) => call(name, args);

  if (typeof window !== 'undefined') {
    // Fires on load, sign-in, sign-out and each hourly token refresh.
    onIdTokenChanged(auth, () => api.refresh());
    setInterval(() => {
      if (document.visibilityState === 'visible' && snapshot.session) api.refresh();
    }, POLL_MS);
    window.addEventListener('focus', () => snapshot.ready && api.refresh());
  }
  return api;
}
