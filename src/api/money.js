// Money is stored as integer cents with a currency code, and only formatted here.
export function money(cents, currency = 'USD') {
  const value = Number(cents || 0) / 100;
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency, minimumFractionDigits: Number.isInteger(value) ? 0 : 2 }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

/** What confirmed sessions have added up to, for the ledger rows that match `keep`. Nothing is charged yet. */
export function owed(db, keep = () => true) {
  const rows = Object.values(db.ledger || {}).filter((r) => r.status === 'accrued' && keep(r));
  return { cents: rows.reduce((sum, r) => sum + r.amountCents, 0), sessions: rows.length, currency: rows[0]?.currency || 'USD' };
}

/** "Free", "$5 a session", or null when the club hasn't said. */
export function feeLabel(club) {
  if (club.sessionFeeCents === undefined || club.sessionFeeCents === null) return null;
  return club.sessionFeeCents > 0 ? `${money(club.sessionFeeCents, club.currency)} a session` : 'Free';
}
