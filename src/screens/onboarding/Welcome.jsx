import { useState } from 'react';
import Wordmark from '../../components/Wordmark.jsx';
import FieldError from '../../components/FieldError.jsx';
import { attempt, useBackend } from '../../api/index.jsx';

const GoogleMark = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.1 5.5c4.2-3.9 6.6-9.6 6.6-16.9z" />
    <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.4-4.6 2.3-8.8 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
);

export default function Welcome() {
  const { api } = useBackend();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    setError(await attempt(api.signInWithGoogle()));
    setBusy(false);
  };

  return (
    <main className="page onboard">
      <div className="onboard-hero">
        <Wordmark size="lg" />
        <h1 className="display">
          Something good
          <br />
          <em>to do after school.</em>
        </h1>
        <p className="body-muted">
          Clubs, mentors and short lessons for 12 to 17 year olds in Zimbabwe.
        </p>
      </div>

      <ol className="how">
        <li>A guardian adds their teen and approves every club.</li>
        <li>Mentors are approved by Stride before any teen can see them.</li>
        <li>Messages stay inside Stride, and the guardian can read all of them.</li>
      </ol>

      <div className="stack-12 onboard-actions">
        <button type="button" className="btn btn-google" disabled={busy} onClick={start}>
          <GoogleMark />
          {busy ? 'Opening Google…' : 'Continue with Google'}
        </button>
        <FieldError>{error}</FieldError>
        <p className="fine">Teens sign in with their own Google account and a code from their guardian.</p>
      </div>
    </main>
  );
}
