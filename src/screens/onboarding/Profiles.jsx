import { useState } from 'react';
import FieldError from '../../components/FieldError.jsx';
import StepHeader from '../../components/StepHeader.jsx';
import Wordmark from '../../components/Wordmark.jsx';
import { relations } from '../../onboarding.js';

const roles = [
  { id: 'guardian', title: 'Parent or guardian', detail: 'Add your teen, approve clubs, read their messages.' },
  { id: 'teen', title: 'Teen with a code', detail: 'Your guardian gave you a 6 character code.' },
  { id: 'mentor', title: 'Mentor or club leader', detail: 'Lead a club or set lessons. Stride checks you first.' }
];

export function RoleChoice({ identity, go, onSignOut }) {
  return (
    <main className="page onboard">
      <Wordmark size="md" />
      <StepHeader kicker={identity?.email} title="Who are you on Stride?">
        You can only pick once for this Google account.
      </StepHeader>
      <ul className="role-list">
        {roles.map((r) => (
          <li key={r.id}>
            <button type="button" className="role-row" onClick={() => go(r.id)}>
              <span className="row-title">{r.title}</span>
              <span className="row-meta">{r.detail}</span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn-quiet" onClick={onSignOut}>Use a different Google account</button>
    </main>
  );
}

function Form({ back, title, lead, children, canSubmit, onSubmit, busy, error, cta }) {
  return (
    <main className="page onboard">
      <StepHeader onBack={back} title={title}>{lead}</StepHeader>
      {children}
      <FieldError>{error}</FieldError>
      <div className="detail-footer onboard-footer">
        <button type="button" className="btn btn-primary" disabled={!canSubmit || busy} onClick={onSubmit}>
          {busy ? 'Saving…' : cta}
        </button>
      </div>
    </main>
  );
}

const Field = ({ label, hint, children }) => (
  <label className="stack-8">
    <span className="field-label">{label}</span>
    {children}
    {hint && <span className="small muted">{hint}</span>}
  </label>
);

export function GuardianForm({ identity, back, onSubmit, busy, error }) {
  const [name, setName] = useState(identity?.name || '');
  const [relation, setRelation] = useState('');
  return (
    <Form back={back} title="About you" lead="Teens only ever see your first name." canSubmit={name.trim()} onSubmit={() => onSubmit({ name, relation })} busy={busy} error={error} cta="Continue">
      <Field label="Your name">
        <input className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <div className="stack-8" role="group" aria-label="Your relationship">
        <span className="field-label">You are their</span>
        <div className="row-8 wrap">
          {relations.map((r) => (
            <button key={r} type="button" className={relation === r ? 'chip is-on' : 'chip'} aria-pressed={relation === r} onClick={() => setRelation(r)}>
              {r}
            </button>
          ))}
        </div>
      </div>
    </Form>
  );
}

export function MentorForm({ identity, back, onSubmit, busy, error }) {
  const [name, setName] = useState(identity?.name || '');
  const [role, setRole] = useState('');
  const [bio, setBio] = useState('');
  return (
    <Form back={back} title="Tell us about you" lead="Stride checks every mentor before they can contact a teen." canSubmit={name.trim() && role.trim()} onSubmit={() => onSubmit({ name, role, bio })} busy={busy} error={error} cta="Send for checking">
      <Field label="Your name">
        <input className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="What you do" hint="For example: Coach at Chess Club.">
        <input className="input" maxLength={80} value={role} onChange={(e) => setRole(e.target.value)} />
      </Field>
      <Field label="A few lines for parents" hint="Optional. Parents read this before they say yes.">
        <textarea className="textarea" rows="4" maxLength={600} value={bio} onChange={(e) => setBio(e.target.value)} />
      </Field>
    </Form>
  );
}

export function JoinForm({ back, onSubmit, busy, error }) {
  const [code, setCode] = useState('');
  return (
    <Form back={back} title="Enter your code" lead="Your guardian sees it after they add you." canSubmit={code.trim().length >= 6} onSubmit={() => onSubmit(code)} busy={busy} error={error} cta="Join">
      <Field label="Join code">
        <input className="input code-field" autoCapitalize="characters" autoComplete="off" spellCheck="false" maxLength={7} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
      </Field>
    </Form>
  );
}

export function Pending({ user, onSignOut }) {
  return (
    <main className="page onboard">
      <Wordmark size="md" />
      <StepHeader kicker="Mentor account" title={`Thanks, ${user.name.split(' ')[0]}`}>
        Stride is checking your details. Until we approve you, teens can't see your profile and you can't message anyone. Open Stride again later and this page will change once you're approved.
      </StepHeader>
      <button type="button" className="btn btn-quiet" onClick={onSignOut}>Sign out</button>
    </main>
  );
}
