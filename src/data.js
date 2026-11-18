// Fixed vocabulary for the app. Clubs, lessons and people are real rows in Firestore, not constants here.
// `day` on a club is the weekday of its session (0 = Sunday).

export const categories = [
  { id: 'Sport', icon: 'sport' },
  { id: 'Tech', icon: 'code' },
  { id: 'Study', icon: 'pawn' },
  { id: 'Arts', icon: 'music' },
  { id: 'STEM', icon: 'robot' },
  { id: 'Career', icon: 'briefcase' }
];

export const categoryIcon = Object.fromEntries(categories.map((c) => [c.id, c.icon]));

export const clubFilters = ['All', ...categories.map((c) => c.id)];

// What every club's leader passed before the club could join Stride.
export function clubChecks(club) {
  const role = club.lead.split(' · ')[0];
  return [`${role} ID checked`, 'Safeguarding training complete', 'Venue and first aid checked'];
}


export const learnFilters = ['All', 'Saved', ...categories.map((c) => c.id)];


export const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const reportReasons = ['Something the mentor said', 'Something that felt unsafe', 'Something else'];
