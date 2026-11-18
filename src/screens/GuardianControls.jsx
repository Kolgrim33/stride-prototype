import { useState } from 'react';
import { Icon } from '../icons.jsx';
import NavBar from '../components/NavBar.jsx';
import SectionHead from '../components/SectionHead.jsx';
import Status from '../components/Status.jsx';
import Toggle from '../components/Toggle.jsx';
import FieldError from '../components/FieldError.jsx';
import { useStore } from '../store.jsx';
import { attempt, useBackend } from '../api/index.jsx';
import { consentItems, formatWhen } from '../onboarding.js';
import { attendanceFor, badgesFor, requestsFor, selectedTeen, teensOf, threads, thread } from '../api/selectors.js';

function downloadJson(filename, data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function GuardianControls() {
  const { state, set } = useStore();
  const { db, user: guardian, api } = useBackend();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const teens = teensOf(db, guardian.id);
  const kid = selectedTeen(db, guardian.id, state.child);

  if (!kid) {
    return (
      <main className="page">
        <NavBar title="Controls" back="#/guardian" />
        <p className="body-muted">Add a teen first. Their controls show up here.</p>
      </main>
    );
  }

  const run = async (promise) => setError(await attempt(promise));
  const setItem = (item, on) =>
    run(api.setConsent(kid.id, { [item.id]: on, ...(item.id === 'mentor' && !on ? { messages: false } : {}) }, `${on ? 'Turned on' : 'Turned off'}: ${item.title}`));
  const newCode = async () => setError(await attempt(api.newJoinCode(kid.id)));

  const download = () => {
    const { joinCode, ...teen } = kid;
    downloadJson(`stride-${kid.name.toLowerCase()}-data.json`, {
      exportedAt: new Date().toISOString(),
      teen,
      guardian: { name: guardian.name, email: guardian.email, relation: guardian.relation },
      requests: requestsFor(db, kid.id),
      attendance: attendanceFor(db, kid.id),
      badges: badgesFor(db, kid.id),
      messages: threads(db, { teenId: kid.id }, 'guardian').flatMap((t) => thread(db, t.teenId, t.mentorId))
    });
  };

  const deleteTeen = async () => {
    const message = await attempt(api.deleteTeen(kid.id));
    setDeleting(false);
    if (message) setError(message);
    else {
      set({ child: null });
      window.location.hash = '#/guardian';
    }
  };

  return (
    <main className="page">
      <NavBar title="Controls" back="#/guardian" />

      {teens.length > 1 && (
        <div className="chips" role="group" aria-label="Choose a teen">
          {teens.map((t) => (
            <button
              key={t.id}
              type="button"
              className={t.id === kid.id ? 'chip chip-dark is-on' : 'chip chip-dark'}
              aria-pressed={t.id === kid.id}
              onClick={() => {
                set({ child: t.id });
                setError(null);
              }}
            >
              <span className="kid-dot" style={{ background: t.color }} aria-hidden="true" />
              {t.name}
            </button>
          ))}
        </div>
      )}

      <header className="title-block">
        <h1 className="h1">{kid.name}'s account</h1>
        <div className="subline">
          <span>
            <strong>{guardian.name}</strong>
            {guardian.relation ? ` · ${guardian.relation}` : ''}
          </span>
          {guardian.verifiedAt && (
            <span className="tag tag-blue">
              <Icon name="shield" size={12} strokeWidth={2.4} />
              Verified
            </span>
          )}
        </div>
      </header>

      <FieldError>{error}</FieldError>

      <section className="panel panel-list" aria-label="Pause account">
        <Toggle
          title={`Pause ${kid.name}'s account`}
          detail="Stops club requests, lessons and mentor messages until you turn it back on."
          on={kid.paused}
          onChange={(on) => run(api.setTeenLimits(kid.id, { paused: on }))}
        />
      </section>
      {kid.paused && <Status icon="lock">Paused. {kid.name} sees a message that you paused the account.</Status>}

      <SectionHead title="What they can use" />
      <section className="panel panel-list" aria-label="Permissions">
        {consentItems
          .filter((item) => !item.needs || kid.consent[item.needs])
          .map((item) => (
            <Toggle
              key={item.id}
              title={item.title}
              detail={item.detail(kid.name)}
              required={item.required}
              on={!!kid.consent[item.id]}
              onChange={(on) => setItem(item, on)}
            />
          ))}
      </section>
      <p className="fine fine-left">{kid.name} can see this list too, so nothing is hidden from them.</p>

      <SectionHead title="Limits" />
      <section className="panel panel-list" aria-label="Limits">
        <Toggle
          title="Quiet hours"
          detail="No notifications from 9 pm to 7 am."
          on={kid.quietHours}
          onChange={(on) => run(api.setTeenLimits(kid.id, { quietHours: on }))}
        />
        <Toggle title="Club requests need my approval" detail="Always on for teen accounts." on required />
      </section>

      <SectionHead title="Signing in" />
      <section className="panel stack-12" aria-label="Signing in">
        {kid.joinCode ? (
          <>
            <p className="body-muted">{kid.name} hasn't joined yet. Give them this code to enter after signing in with Google.</p>
            <output className="join-code-value">{kid.joinCode}</output>
            <button type="button" className="btn btn-ghost" onClick={newCode}>
              Make a new code
            </button>
          </>
        ) : (
          <p className="body-muted">{kid.name} signs in with their own Google account.</p>
        )}
      </section>

      <SectionHead title="Consent history" />
      <section className="panel panel-list" aria-label="Consent history">
        {(kid.consentLog || []).length === 0 ? (
          <p className="row-meta empty">No changes recorded yet.</p>
        ) : (
          [...kid.consentLog].reverse().map((entry, i) => (
            <div className="club-line" key={`${entry.at}-${i}`}>
              <span className="check-dot" aria-hidden="true">
                <Icon name="check" size={16} strokeWidth={2} />
              </span>
              <div className="stack-2">
                <span className="row-title">{entry.note}</span>
                <span className="row-meta">
                  {entry.by} · {formatWhen(entry.at)} · terms {entry.version}
                </span>
              </div>
            </div>
          ))
        )}
      </section>

      <SectionHead title="Data" />
      <button type="button" className="btn btn-ghost" onClick={download}>
        <Icon name="download" size={18} strokeWidth={1.8} />
        Download {kid.name}'s data
      </button>
      <button type="button" className="btn btn-danger-outline" onClick={() => setDeleting(true)}>
        Delete {kid.name}'s account
      </button>

      {deleting && (
        <div className="backdrop" onClick={(e) => e.target === e.currentTarget && setDeleting(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Delete account">
            <div className="stack-12">
              <h2 className="card-title card-title-lg">Delete {kid.name}'s account?</h2>
              <p className="body-muted">
                This removes {kid.name}'s profile, clubs, record, badges and messages. It can't be undone.
              </p>
              <div className="row-8">
                <button type="button" className="btn btn-danger grow" onClick={deleteTeen}>
                  Delete
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setDeleting(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
