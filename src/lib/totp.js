import { hotpTrace } from './hotp.js';

/**
 * The latest Unix time, in seconds, the app will show. JavaScript dates stop at
 * 8,640,000,000,000 seconds, and anything past that cannot be formatted.
 */
export const MAX_UNIX_SECONDS = 8_640_000_000_000;

/**
 * Converts Unix time into the TOTP counter and the position within the current step.
 * Times before T0 have no valid counter. The UI clamps scrubbing so this never happens,
 * and this function returns step 0 rather than a negative counter if it is ever asked.
 *
 * @param {number} unixSeconds The Unix time in whole seconds.
 * @param {number} period The period X in seconds.
 * @param {number} t0 The epoch offset T0 in seconds.
 * @returns {{ counter: number, secondsIntoStep: number, secondsRemaining: number, stepStart: number }}
 *   The counter T, seconds elapsed and left in the step, and the Unix time the step began.
 * @example
 * timeToCounter(59, 30, 0) // { counter: 1, secondsIntoStep: 29, secondsRemaining: 1, stepStart: 30 }
 */
export function timeToCounter(unixSeconds, period, t0) {
  const safePeriod = Math.max(1, Number(period) || 30);
  const safeT0 = Number(t0) || 0;
  const elapsed = Math.max(0, (Number(unixSeconds) || 0) - safeT0);

  const counter = Math.floor(elapsed / safePeriod);
  const secondsIntoStep = elapsed % safePeriod;

  return {
    counter,
    secondsIntoStep,
    secondsRemaining: safePeriod - secondsIntoStep,
    stepStart: counter * safePeriod + safeT0,
  };
}

/**
 * Builds the full TOTP trace for a key at a given Unix time.
 *
 * @param {Uint8Array} key The decoded secret.
 * @param {number} unixSeconds The Unix time in seconds.
 * @param {{ digits: number, period: number, t0: number }} options Code length, period X and T0.
 * @returns {Promise<import('./hotp.js').HotpTrace>} The HOTP trace for that time step.
 * @example
 * await totpTrace(rfcKey, 59, { digits: 8, period: 30, t0: 0 }) // trace.code === '94287082'
 */
export async function totpTrace(key, unixSeconds, options) {
  const { digits = 6, period = 30, t0 = 0 } = options ?? {};

  if (unixSeconds < t0) {
    throw new RangeError('The time is before T0, so there is no valid counter.');
  }

  const { counter } = timeToCounter(unixSeconds, period, t0);
  return hotpTrace(key, counter, digits);
}
