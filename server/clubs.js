// The real clubs Stride launches with. Add one here and it appears on the next server start.
// `leaderEmail` is the Google address of the leader: when that person signs up as a mentor,
// the club becomes theirs. It is never sent to the browser.
// Shape: { id, name, type, day (0 = Sunday), time, when, short, ages, range, lead, session, confirmer, note, about, leaderEmail,
//          sessionFeeCents (integer, 0 or missing = free), currency ('USD') }
// Each confirmed session adds sessionFeeCents to the club's "owed" total. Nothing is charged yet: it is a record only.
export const seedClubs = [];
