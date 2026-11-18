import { useCallback, useState } from 'react';
import { useStore } from '../../store.jsx';
import { attempt, useBackend } from '../../api/index.jsx';
import { defaultConsent } from '../../onboarding.js';
import Welcome from './Welcome.jsx';
import TeenSetup from './TeenSetup.jsx';
import { GuardianForm, JoinForm, MentorForm, Pending, RoleChoice } from './Profiles.jsx';
import { Activated, ChildProfile, ConsentStep } from './GuardianSteps.jsx';

const emptyDraft = { dob: '', teenName: '', consent: defaultConsent, quietHours: true, joinCode: '', interests: [], goal: 2, nickname: '' };

/**
 * Everything before the main app: Google sign-in, picking a role, and the first-run steps.
 * mode="addTeen" is a signed-in guardian adding a teen; "teenSetup" is a teen who just joined;
 * "pending" is a mentor Stride hasn't approved yet.
 */
export default function Onboarding({ mode }) {
  const { set } = useStore();
  const { api, user, identity } = useBackend();
  const [draft, setDraft] = useState(() => ({ ...emptyDraft, ...(user?.role === 'teen' ? { teenName: user.name, nickname: user.nickname || user.name } : {}) }));
  const first = mode === 'addTeen' ? 'consent' : mode === 'teenSetup' ? 'teenSetup' : mode === 'pending' ? 'pending' : identity ? 'role' : 'welcome';
  const [history, setHistory] = useState([first]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const step = history[history.length - 1];

  const update = useCallback((patch) => setDraft((prev) => ({ ...prev, ...patch })), []);
  const go = (next) => {
    setError(null);
    setHistory((prev) => [...prev, next]);
    window.scrollTo(0, 0);
  };
  const back = () => {
    setError(null);
    if (mode === 'addTeen' && history.length === 1) {
      set({ setup: null });
      window.location.hash = '#/guardian';
      return;
    }
    setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  // Runs a backend call with the busy flag and an inline error; true when it worked.
  const run = async (work) => {
    setBusy(true);
    setError(null);
    const message = await attempt(work());
    setBusy(false);
    if (message) setError(message);
    return !message;
  };

  const props = { draft, update, back };
  const shared = { busy, error };

  switch (step) {
    case 'role':
      return <RoleChoice identity={identity} go={go} onSignOut={() => api.signOut()} />;
    case 'guardian':
      return <GuardianForm identity={identity} back={back} {...shared} onSubmit={(f) => run(() => api.registerGuardian(f)).then((ok) => ok && (window.location.hash = '#/guardian'))} />;
    case 'mentor':
      return <MentorForm identity={identity} back={back} {...shared} onSubmit={(f) => run(() => api.registerMentor(f))} />;
    case 'teen':
      return <JoinForm back={back} {...shared} onSubmit={async (code) => {
        // `setup` keeps this screen up while the signed-in user changes underneath it.
        set({ setup: { mode: 'teenSetup' } });
        if (await run(() => api.joinWithCode(code))) setHistory(['teenSetup']);
        else set({ setup: null });
      }} />;
    case 'pending':
      return <Pending user={user} onSignOut={() => api.signOut()} />;
    case 'consent':
      return <ConsentStep {...props} onAgree={() => go('child')} />;
    case 'child':
      return (
        <ChildProfile
          {...props}
          {...shared}
          onActivate={async () => {
            let id;
            const ok = await run(async () => {
              id = await api.createTeen({ name: draft.teenName, dob: draft.dob, consent: draft.consent, quietHours: draft.quietHours });
            });
            if (!ok) return;
            const snap = await api.refresh();
            update({ joinCode: snap.db.users[id]?.joinCode || '' });
            setHistory(['activated']);
          }}
        />
      );
    case 'activated':
      return <Activated draft={draft} onDashboard={() => { set({ setup: null }); window.location.hash = '#/guardian'; }} />;
    case 'teenSetup': {
      // A teen who just joined has a profile now, but this draft was made before it existed.
      const filled = { ...draft, teenName: draft.teenName || user?.name || '', nickname: draft.nickname || user?.nickname || '' };
      return (
        <TeenSetup
          draft={filled}
          update={update}
          {...shared}
          onDone={async () => {
            if (await run(() => api.updateTeenProfile({ nickname: filled.nickname, interests: draft.interests, goal: draft.goal }))) {
              set({ setup: null });
              window.location.hash = '#/today';
            }
          }}
        />
      );
    }
    default:
      return <Welcome />;
  }
}
