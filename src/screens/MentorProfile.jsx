import { useState } from 'react';
import { Icon } from '../icons.jsx';
import NavBar from '../components/NavBar.jsx';
import { useBackend } from '../api/index.jsx';
import { allowed } from '../api/selectors.js';

const backFor = { teen: '#/mentor', guardian: '#/guardian', mentor: '#/dashboard' };

export default function MentorProfile({ person }) {
  const { user } = useBackend();
  const [failed, setFailed] = useState(false);
  const mentor = person;
  const canMessage = user.role === 'teen' && allowed(user, 'messages');

  return (
    <main className="page">
      <NavBar title={user.role === 'mentor' && user.mentorId === mentor.id ? 'Your public profile' : 'Mentor profile'} back={backFor[user.role]} />

      <section className="mentor-hero" aria-label={mentor.name}>
        {mentor.photo && !failed ? (
          <img className="mentor-photo" src={mentor.photo} alt={mentor.name} onError={() => setFailed(true)} />
        ) : (
          <span className="mentor-photo mentor-photo-empty" aria-hidden="true">
            {mentor.initials}
          </span>
        )}
      </section>

      <div className="stack-6 center">
        <h1 className="h1 h1-profile">{mentor.name}</h1>
        <span className="row-meta">{mentor.role}</span>
        <span className="mentor-badge">
          <Icon name="shield" size={14} strokeWidth={2.4} />
          Approved by Stride
        </span>
      </div>

      {mentor.bio && (
        <section className="card card-pad" aria-label="About">
          <h2 className="section-title">About {mentor.first}</h2>
          <p className="body">{mentor.bio}</p>
        </section>
      )}

      <div className="callout">
        <Icon name="eye" size={20} strokeWidth={1.6} />
        <p>Every message with {mentor.first} stays inside Stride, and guardians can read all of them.</p>
      </div>

      {canMessage && (
        <a className="btn btn-primary" href={`#/chat/${mentor.id}`}>
          <Icon name="message" size={18} strokeWidth={1.8} />
          Message {mentor.first}
        </a>
      )}
    </main>
  );
}
