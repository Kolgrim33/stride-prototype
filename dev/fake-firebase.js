// Test double for src/firebase.js: "Google" signs in as whoever ?as=name asks for. Dev and screenshots only.
const listeners = new Set();
const current = () => localStorage.getItem('fake-uid');
export const auth = {
  get currentUser() {
    const uid = current();
    return uid ? { getIdToken: async () => `${uid}|${uid}@example.com` } : null;
  }
};
export const API_URL = 'http://localhost:8788';
export const googleSignIn = async () => {
  const uid = new URLSearchParams(location.search).get('as') || 'tester';
  localStorage.setItem('fake-uid', uid);
  listeners.forEach((fn) => fn());
};
export const googleSignOut = async () => {
  localStorage.removeItem('fake-uid');
  listeners.forEach((fn) => fn());
};
export const onIdTokenChanged = (_auth, fn) => {
  listeners.add(fn);
  setTimeout(fn, 0);
  return () => listeners.delete(fn);
};
