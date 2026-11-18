// The only data layer. Screens call useBackend() and never touch Firebase or fetch directly.
import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import { createRemoteBackend } from './remote.js';
import { currentUser } from './selectors.js';

let shared;
export const getBackend = () => (shared ||= createRemoteBackend());

const BackendContext = createContext(null);

export function BackendProvider({ backend = getBackend(), children }) {
  return <BackendContext.Provider value={backend}>{children}</BackendContext.Provider>;
}

export function useBackend() {
  const api = useContext(BackendContext);
  const snapshot = useSyncExternalStore(api.subscribe, api.getSnapshot);
  const user = useMemo(() => currentUser(snapshot.db, snapshot.session), [snapshot.db, snapshot.session]);
  return { db: snapshot.db, session: snapshot.session, identity: snapshot.identity, ready: snapshot.ready, error: snapshot.error, user, api };
}

/** Runs a backend call; returns the error message to show, or null when it worked. */
export async function attempt(promise) {
  try {
    await promise;
    return null;
  } catch (error) {
    return error?.message || 'Something went wrong. Try again.';
  }
}
