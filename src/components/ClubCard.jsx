import { Icon } from '../icons.jsx';
import Cover from './Cover.jsx';

const statusTag = {
  member: <span className="tag tag-green">You're in</span>,
  pending: <span className="tag tag-green">Asked your guardian</span>,
  declined: <span className="tag tag-warn-soft">Not now</span>
};

// Photo-led card for the Discover feed. `status` is the teen's: member, pending, declined or null.
export default function ClubCard({ club, status }) {
  return (
    <a className="club-card" href={`#/club/${club.id}`}>
      <Cover type={club.type} size="lg" photo={club.id}>
        <span className="over over-left">
          <span className="tag tag-dark">Ages {club.range}</span>
        </span>
      </Cover>
      <span className="club-card-body">
        {club.verified && (
          <span className="tag tag-blue">
            <Icon name="shield" size={12} strokeWidth={2.4} />
            Checked by Stride
          </span>
        )}
        <span className="club-card-title">{club.name}</span>
        <span className="row-meta">{club.lead.replace(' · ', ' ')}</span>
        <span className="club-card-note">{club.about}</span>
        <span className="meta-row">
          <span>
            <Icon name="calendar" size={14} strokeWidth={1.8} /> {club.when.split(',')[0]}
          </span>
          <span>
            <Icon name="clock" size={14} strokeWidth={1.8} /> {club.time}
          </span>
        </span>
        <span className="club-card-foot">
          <span className="price">{club.cost?.price}</span>
          {statusTag[status]}
        </span>
      </span>
    </a>
  );
}
