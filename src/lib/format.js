/**
 * Display formatting for codes and times. Pure JavaScript with no React imports.
 */

/**
 * Splits a code into two groups so it is easier to read: 123 456, 123 4567, 1234 5678.
 *
 * @param {string} code The zero-padded code.
 * @returns {string} The code with a space between the groups.
 * @example
 * groupCode('287082') // '287 082'
 * groupCode('1234567') // '123 4567'
 */
export function groupCode(code) {
  const split = Math.floor(code.length / 2);
  return `${code.slice(0, split)} ${code.slice(split)}`;
}

/**
 * Describes how far a scrubbed time is from real time, as a signed duration.
 *
 * @param {number} offsetMs Scrubbed time minus real time, in milliseconds.
 * @returns {string} Text such as '+00:02:30' or '-3d 04:00:00'.
 * @example
 * formatOffset(150000) // '+00:02:30'
 */
export function formatOffset(offsetMs) {
  const sign = offsetMs < 0 ? '-' : '+';
  let seconds = Math.floor(Math.abs(offsetMs) / 1000);
  const days = Math.floor(seconds / 86400);
  seconds -= days * 86400;
  const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const dayPart = days > 0 ? `${days.toLocaleString('en-GB')}d ` : '';
  return `${sign}${dayPart}${hh}:${mm}:${ss}`;
}

/**
 * Formats a time for a `datetime-local` input, in the viewer's local time zone.
 *
 * @param {number} ms Milliseconds since the Unix epoch.
 * @returns {string} Text such as '2026-11-10T14:05:09'.
 * @example
 * toLocalInputValue(Date.UTC(2026, 0, 2, 3, 4, 5)) // '2026-01-02T03:04:05' when local time is UTC
 */
export function toLocalInputValue(ms) {
  const date = new Date(ms);
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Formats Unix seconds as a UTC ISO string without milliseconds.
 *
 * @param {number} unixSeconds Seconds since the Unix epoch.
 * @returns {string} Text such as '2009-02-13T23:31:30Z'.
 * @example
 * toUtcString(1234567890) // '2009-02-13T23:31:30Z'
 */
export function toUtcString(unixSeconds) {
  return new Date(unixSeconds * 1000).toISOString().replace('.000Z', 'Z');
}

/**
 * Formats Unix seconds as local date and time for the UI, in UK style.
 *
 * @param {number} unixSeconds Seconds since the Unix epoch.
 * @returns {string} Local date and time text.
 * @example
 * toLocalString(0) // '01/01/1970, 01:00:00' in London
 */
export function toLocalString(unixSeconds) {
  return new Date(unixSeconds * 1000).toLocaleString('en-GB');
}
