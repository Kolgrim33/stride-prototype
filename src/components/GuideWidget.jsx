import { useEffect, useRef, useState } from 'react';
import { Icon } from '../icons.jsx';
import { useBackend } from '../api/index.jsx';
import { API_URL } from '../firebase.js';

const CHAT_URL = `${API_URL}/api/chat`;
const starters = ['Which club suits me?', 'What should I learn this week?', 'How do I ask my guardian to approve a club?'];

// Teens only: a floating AI guide in the bottom-right corner that knows the clubs and lessons on offer.
export default function GuideWidget() {
  const { db } = useBackend();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const end = useRef(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [turns.length, busy, open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

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
      const res = await fetch(CHAT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: next, context }) });
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
    <>
      {open && (
        <section className="guide-panel" role="dialog" aria-label="Stride Guide">
          <header className="guide-head">
            <Icon name="message" size={18} strokeWidth={1.8} />
            <span className="row-title grow">Stride Guide</span>
            <button type="button" className="guide-close" aria-label="Close guide" onClick={() => setOpen(false)}>
              <Icon name="x" size={18} strokeWidth={2} />
            </button>
          </header>
          <ol className="chat guide-log" aria-label="Conversation" aria-live="polite">
            <li className="row-meta">An AI helper, not a person. It can be wrong, and your guardian can’t see this chat. For anything serious, talk to your guardian or mentor.</li>
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
              <li key={i}>
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
          <form className="composer guide-composer" onSubmit={submit}>
            <label className="visually-hidden" htmlFor="guide-msg">
              Ask the guide
            </label>
            <textarea
              id="guide-msg"
              className="textarea composer-input"
              rows="1"
              maxLength={1000}
              placeholder="Ask the guide…"
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
        </section>
      )}
      <button type="button" className="guide-fab" aria-label={open ? 'Close Stride Guide' : 'Ask Stride Guide'} aria-expanded={open} onClick={() => setOpen(!open)}>
        <Icon name={open ? 'x' : 'message'} size={24} strokeWidth={1.8} />
      </button>
    </>
  );
}
