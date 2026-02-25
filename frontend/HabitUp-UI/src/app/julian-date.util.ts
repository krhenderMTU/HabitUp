/**
 * Julian Day Number (JDN) utilities.
 *
 * The Julian Day Number is an integer count of days since the beginning of the
 * Julian Period (Jan 1, 4713 BC). It is widely used in astronomy and database
 * systems as a compact, timezone-agnostic representation of a calendar date.
 *
 * Example: 2025-01-01  →  2460677
 */

/** Convert a JS Date (or ISO string YYYY-MM-DD) to a Julian Day Number. */
export function toJulian(input: Date | string): number {
  const d = typeof input === 'string' ? new Date(input + 'T12:00:00') : input;
  const Y = d.getFullYear();
  const M = d.getMonth() + 1;
  const D = d.getDate();

  const a = Math.floor((14 - M) / 12);
  const y = Y + 4800 - a;
  const m = M + 12 * a - 3;

  return (
    D +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/** Convert a Julian Day Number back to a JS Date. */
export function fromJulian(jdn: number): Date {
  const l = jdn + 68569;
  const n = Math.floor((4 * l) / 146097);
  const l2 = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l2 + 1)) / 1461001);
  const l3 = l2 - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l3) / 2447);
  const day = l3 - Math.floor((2447 * j) / 80);
  const l4 = Math.floor(j / 11);
  const month = j + 2 - 12 * l4;
  const year = 100 * (n - 49) + i + l4;
  return new Date(year, month - 1, day);
}

/** Format a Julian Day Number as a human-readable Gregorian string (e.g. "Jan 1, 2025"). */
export function julianToDisplay(jdn: number): string {
  return fromJulian(jdn).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Convert a JS Date to an ISO date string (YYYY-MM-DD) for use in date inputs. */
export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Today as a Julian Day Number. */
export function todayJulian(): number {
  return toJulian(new Date());
}
