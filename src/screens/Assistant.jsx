import { useEffect, useRef, useState } from 'react';
import { Icon } from '../icons.jsx';
import NavBar from '../components/NavBar.jsx';
import { useBackend } from '../api/index.jsx';

const URL = import.meta.env.VITE_ASSISTANT_URL || '/api/chat';
const starters = ['Which club suits me?', 'What should I learn this week?', 'How do I ask my guardian to approve a club?'];

// Teens only: an AI guide that knows the clubs and lessons on offer.
export default function Assistant() {
  const { db } = useBackend();
  const [turns, setTurns] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const end = useRef(null);
  useEffect(() => end.current?.scrollIntoView({ block: 'end' }), [turns.length, busy]);

  const context = [
    'Clubs: ' + Object.values(db.clubs).map((c) => `${c.name} (${c.short})`).join('; '),
    'Lessons: ' + Object.values(db.lessons).map((l) => l.title).join('; ')
  ].join('\n');

  const ask = async (content) => {
    const next = [...turns, { role: 'user', content }];
    setTurns(next);
    setText('');
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: next, context }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.reply) throw new Error(data.error || 'The guide did not answer. Try again.');
      setTurns([...next, { role: 'assistant', content: data.reply }]);
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  const submit = (e) => {
    e.preventDefault();
    if (text.trim() && !busy) ask(text.trim());
  };

  return (
    <div className="detail">
      <main className="page">
        <NavBar title="Stride Guide" back="#/today" />
        <section className="callout" aria-label="About the guide">
          <Icon name="sparkles" size={20} strokeWidth={1.6} />
          <p>An AI helper, not a person. It can be wrong, and your guardian can’t see this chat. For anything serious, talk to your guardian or mentor.</p>
        </section>
        <ol className="chat" aria-label="Conversation" aria-live="polite">
          {turns.length === 0 && (
            <li className="guide-starters">
              {starters.map((s) => (
                <button key={s} type="button" className="chip-btn" onClick={() => ask(s)}>
                  {s}
                </button>
              ))}
            </li>
          )}
          {turns.map((m, i) => (
            <li key={i} className="stack-4">
              <div className={`bubble ${m.role === 'user' ? 'is-own' : 'is-mentor'}`}>{m.content}</div>
            </li>
          ))}
          {busy && (
            <li>
              <div className="bubble is-mentor guide-typing" role="status" aria-label="Guide is typing">
                <span /> <span /> <span />
              </div>
            </li>
          )}
          {error && (
            <li className="row-meta center" role="alert">
              {error}
            </li>
          )}
          <li ref={end} aria-hidden="true" />
        </ol>
      </main>
      <div className="detail-footer">
        <form className="composer" onSubmit={submit}>
          <label className="visually-hidden" htmlFor="guide-msg">
            Ask the guide
          </label>
          <textarea
            id="guide-msg"
            className="textarea composer-input"
            rows="1"
            maxLength={1000}
            placeholder="Ask about clubs, lessons, school…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) submit(e);
            }}
          />
          <button type="submit" className="composer-send" aria-label="Send" disabled={!text.trim() || busy}>
            <Icon name="send" size={18} strokeWidth={2} />
          </button>
        </form>
      </div>
    </div>
  );
}
