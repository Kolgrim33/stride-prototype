import Art from '../components/Art.jsx';
import { useState } from 'react';
import { Icon } from '../icons.jsx';
import NavBar from '../components/NavBar.jsx';
import SectionHead from '../components/SectionHead.jsx';
import FieldError from '../components/FieldError.jsx';
import MeDot from '../components/MeDot.jsx';
import MentorAvatar from '../components/MentorAvatar.jsx';
import { useStore } from '../store.jsx';
import { attempt, useBackend } from '../api/index.jsx';
import { consentItems } from '../onboarding.js';
import { teensOf } from '../api/selectors.js';

const roleName = { teen: 'Teen', guardian: 'Guardian', mentor: 'Mentor' };
const homeOf = { teen: '#/today', guardian: '#/guardian', mentor: '#/dashboard' };

export default function Account() {
  const { set } = useStore();
  const { db, user, api } = useBackend();
  const [error, setError] = useState(null);
  const guardian = user.role === 'teen' ? db.users[user.guardianId] : null;
  const lastChange = user.role === 'teen' ? user.consentLog?.at(-1) : null;

  const signOut = async () => {
    const message = await attempt(api.signOut());
    if (message) setError(message);
    else {
      set({ child: null, setup: null });
      window.location.hash = '#/';
    }
  };
  return (
    <main className="page">
      {user.role === 'guardian' ? (
        <header className="title-block">
        <Art name="account" />
          <h1 className="h1">Account</h1>
        </header>
      ) : (
        <>
          <NavBar title="Account" back={homeOf[user.role]} />
          <Art name="account" strip />
        </>
      )}

      <section className="profile-card" aria-label="You">
        {user.role === 'teen' ? (
          <MeDot person={user} large />
        ) : user.role === 'mentor' ? (
          <MentorAvatar size="xl" person={db.mentors[user.mentorId]} />
        ) : (
          <span className="me-dot me-dot-lg" style={{ background: 'var(--ink)' }} aria-hidden="true">
            {user.name[0]}
          </span>
        )}
        <span className="stack-4 grow min-0">
          <span className="profile-name">{user.role === 'teen' ? user.nickname : user.name}</span>
          <span className="row-meta">
            {roleName[user.role]}{user.email ? ` · ${user.email}` : ''}
          </span>
        </span>
      </section>

      {user.role === 'teen' && (
        <>
          <SectionHead title="What your guardian allowed" />
          <section className="panel" aria-label="What your guardian allowed">
            <ul className="checks">
              {consentItems.map((item) => {
                const on = !user.paused && user.consent[item.id];
                return (
                  <li key={item.id} className={on ? undefined : 'is-off'}>
                    <Icon name={on ? 'check' : 'lock'} size={16} strokeWidth={2} color={on ? 'var(--accent)' : 'var(--subtle)'} />
                    {item.title}
                  </li>
                );
              })}
            </ul>
          </section>
          <p className="fine fine-left">
            {guardian ? `Set by ${guardian.name}` : 'Set by your guardian'}
            {lastChange ? `, last changed ${new Date(lastChange.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}.
            {user.paused ? ' Your account is paused for now.' : ''} Talk to them if you'd like something changed.
          </p>
        </>
      )}

      {user.role === 'guardian' && (
        <>
          <SectionHead title="Your teens" />
          <section className="panel panel-list" aria-label="Your teens">
            {teensOf(db, user.id).map((t) => (
              <a key={t.id} className="club-line" href="#/guardian/controls" onClick={() => set({ child: t.id })}>
                <MeDot person={t} />
                <span className="stack-2 grow">
                  <span className="row-title">{t.name}</span>
                  <span className="row-meta">{t.uid === undefined && t.joinCode ? `Code ${t.joinCode}` : 'Joined'}{t.paused ? ' · paused' : ''}</span>
                </span>
                <Icon name="arrowRight" size={16} strokeWidth={1.8} color="var(--subtle)" />
              </a>
            ))}
            <button type="button" className="club-line link-row" onClick={() => set({ setup: { mode: 'addTeen' } })}>
              <span className="add-tile" aria-hidden="true">
                <Icon name="plus" size={18} strokeWidth={2} />
              </span>
              <span className="row-title grow">Add a teen</span>
            </button>
          </section>
        </>
      )}

      {user.role === 'mentor' && (
        <a className="btn btn-ghost" href="#/mentor">
          <Icon name="eye" size={18} strokeWidth={1.8} />
          See your public profile
        </a>
      )}

      <FieldError>{error}</FieldError>

      <button type="button" className="btn btn-primary" onClick={signOut}>
        Sign out
      </button>

    </main>
  );
}
