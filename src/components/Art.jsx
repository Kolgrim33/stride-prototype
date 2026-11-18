import { Icon } from '../icons.jsx';

// Original page art: track-lane arcs (the Stride mark) with one large icon. Decorative only.
const scenes = {
  today: ['green', 'today'],
  clubs: ['green', 'compass'],
  learn: ['violet', 'bookOpen'],
  mentor: ['teal', 'message'],
  account: ['ink', 'lock'],
  family: ['ink', 'shield'],
  controls: ['ink', 'sliders'],
  messages: ['teal', 'message'],
  club: ['green', 'clubs'],
  lessons: ['violet', 'bookOpen'],
  teens: ['green', 'clubs'],
  desk: ['green', 'clipboard'],
  award: ['green', 'award'],
  lost: ['ink', 'compass'],
  setup: ['green', 'sport'],
};

export default function Art({ name, strip = false }) {
  const [tone, icon] = scenes[name] || scenes.clubs;
  return (
    <div className={`art art-${tone}${strip ? ' art-strip' : ''}`} aria-hidden="true">
      <svg className="art-lanes" viewBox="0 0 240 140" preserveAspectRatio="xMaxYMid slice">
        <g fill="none" stroke="currentColor" strokeWidth="14">
          <circle cx="210" cy="120" r="150" opacity=".10" />
          <circle cx="210" cy="120" r="115" opacity=".14" />
          <circle cx="210" cy="120" r="80" opacity=".20" />
        </g>
      </svg>
      <span className="art-icon">
        <Icon name={icon} size={64} strokeWidth={1.6} />
      </span>
    </div>
  );
}
