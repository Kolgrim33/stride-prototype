import { useState } from 'react';
import FieldError from '../../components/FieldError.jsx';
import { Icon } from '../../icons.jsx';
import StepHeader from '../../components/StepHeader.jsx';
import Toggle from '../../components/Toggle.jsx';
import { MAX_AGE, MIN_AGE, POLICY_VERSION, ageBand, ageFrom, consentItems } from '../../onboarding.js';

const TOTAL = 2;

export function ConsentStep({ draft, update, back, onAgree, step = 1, total = TOTAL }) {
  const name = draft.teenName.trim() || 'Your teen';
  const setItem = (id, on) =>
    update({ consent: { ...draft.consent, [id]: on, ...(id === 'mentor' && !on ? { messages: false } : {}) } });

  return (
    <main className="page onboard">
      <StepHeader onBack={back} step={step} total={total} kicker="Your permission" title={`What can ${name} use?`}>
        Each one is separate. You can change any of them later in Guardian, Controls.
      </StepHeader>

      <section className="panel panel-list" aria-label="Permissions">
        {consentItems
          .filter((item) => !item.needs || draft.consent[item.needs])
          .map((item) => (
            <Toggle
              key={item.id}
              title={item.title}
              detail={item.detail(name)}
              required={item.required}
              on={!!draft.consent[item.id]}
              onChange={(on) => setItem(item.id, on)}
            />
          ))}
      </section>

      <p className="fine fine-left">
        We save who agreed, when, and to which version of the terms (version {POLICY_VERSION}).
      </p>

      <div className="detail-footer onboard-footer">
        <button type="button" className="btn btn-primary" onClick={onAgree}>
          I agree to these
        </button>
      </div>
    </main>
  );
}

export function ChildProfile({ draft, update, back, onActivate, step = 2, total = TOTAL, error, busy }) {
  const band = ageBand(ageFrom(draft.dob));
  const ready = draft.teenName.trim() && band === 'teen';

  return (
    <main className="page onboard">
      <StepHeader photo="chess" onBack={back} step={step} total={total} kicker="Teen profile" title="About your teen">
        Only you and their club leaders see their full name.
      </StepHeader>

      <label className="stack-8">
        <span className="field-label">First name</span>
        <input className="input" autoComplete="off" value={draft.teenName} onChange={(e) => update({ teenName: e.target.value })} />
      </label>

      <label className="stack-8">
        <span className="field-label">Date of birth</span>
        <input
          className="input"
          type="date"
          value={draft.dob}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => update({ dob: e.target.value })}
        />
        {draft.dob && band !== 'teen' && (
          <span className="small field-error">
            Stride teen accounts are for {MIN_AGE} to {MAX_AGE} year olds.
          </span>
        )}
      </label>

      <section className="panel panel-list" aria-label="Limits">
        <Toggle
          title="Quiet hours"
          detail="No notifications from 9 pm to 7 am."
          on={draft.quietHours}
          onChange={(on) => update({ quietHours: on })}
        />
        <Toggle title="Club requests need my approval" detail="Always on for teen accounts." on required />
      </section>

      <FieldError>{error}</FieldError>

      <div className="detail-footer onboard-footer">
        <button type="button" className="btn btn-primary" disabled={!ready || busy} onClick={onActivate}>
          {busy ? 'Saving…' : `Add ${draft.teenName.trim() || 'your teen'}`}
        </button>
      </div>
    </main>
  );
}

export function Activated({ draft, onDashboard }) {
  const allowed = consentItems.filter((item) => draft.consent[item.id]);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft.joinCode);
      setCopied(true);
    } catch {
      // no clipboard: the code is on screen to read out
    }
  };

  return (
    <main className="page onboard">
      <StepHeader photo="pitch" title={`Give ${draft.teenName} this code`}>
        {draft.teenName} opens Stride, signs in with their own Google account, and types the code. It works once.
      </StepHeader>

      <section className="join-code" aria-label="Join code">
        <output className="join-code-value" aria-live="polite">{draft.joinCode}</output>
        <button type="button" className="btn btn-ghost" onClick={copy}>
          {copied ? 'Copied' : 'Copy code'}
        </button>
      </section>

      <section className="panel" aria-label="What you allowed">
        <div className="panel-head">
          <h2 className="section-title">You allowed</h2>
          <Icon name="shield" size={18} strokeWidth={1.6} color="var(--accent)" />
        </div>
        <ul className="checks">
          {allowed.map((item) => (
            <li key={item.id}>
              <Icon name="check" size={16} strokeWidth={2} color="var(--accent)" />
              {item.title}
            </li>
          ))}
        </ul>
      </section>

      <div className="detail-footer onboard-footer">
        <button type="button" className="btn btn-primary" onClick={onDashboard}>
          Done
        </button>
      </div>
    </main>
  );
}
