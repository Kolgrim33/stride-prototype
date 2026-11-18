// Firebase web config is public by design: it names the project, it doesn't grant access.
// Access is enforced by Google sign-in (verified on the server) and the Firestore rules.
import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, onIdTokenChanged, signInWithPopup, signOut } from 'firebase/auth';

const app = initializeApp({
  apiKey: 'AIzaSyCGIkdyr_5qYs37wsWPlxTvTVaWSVvJufQ',
  authDomain: 'stride-app-zw.firebaseapp.com',
  projectId: 'stride-app-zw',
  appId: '1:300791254300:web:4aac8e57e1310c6f82bed9'
});

export const auth = getAuth(app);
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8787').replace(/\/$/, '');
export const googleSignIn = () => signInWithPopup(auth, new GoogleAuthProvider());
export const googleSignOut = () => signOut(auth);
export { onIdTokenChanged };
