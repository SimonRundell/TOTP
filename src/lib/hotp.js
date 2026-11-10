/**
 * @typedef {Object} HotpTrace
 * @property {bigint} counter The counter value used for the digest.
 * @property {Uint8Array} counterBytes The 8-byte big-endian counter.
 * @property {Uint8Array} digest The 20-byte HMAC-SHA-1 output.
 * @property {number} lastByte digest[19].
 * @property {number} offset lastByte & 0x0F.
 * @property {Uint8Array} windowBytes The four raw bytes at offset.
 * @property {number} maskedFirstByte windowBytes[0] & 0x7F.
 * @property {boolean} maskChangedByte True when the top bit was set before masking.
 * @property {number} binaryCode The 31-bit positive integer P.
 * @property {number} digits The number of digits in the code.
 * @property {number} modulus 10 ** digits.
 * @property {string} code The zero-padded code.
 */

import { counterToBytes } from './bytes.js';
import { hmacSha1 } from './hmac.js';

/**
 * Runs HOTP (RFC 4226) and returns every intermediate value so the UI can show its working.
 *
 * @param {Uint8Array} key The decoded secret key.
 * @param {bigint|number} counter The non-negative counter.
 * @param {number} digits 6, 7 or 8.
 * @returns {Promise<HotpTrace>} The full trace.
 * @example
 * const trace = await hotpTrace(rfcKey, 1, 6);
 * trace.offset // 11
 * trace.code   // '287082'
 */
export async function hotpTrace(key, counter, digits) {
  if (![6, 7, 8].includes(digits)) {
    throw new RangeError('Digits must be 6, 7 or 8.');
  }

  const resolvedCounter = BigInt(counter);
  const counterBytes = counterToBytes(resolvedCounter);
  const digest = await hmacSha1(key, counterBytes);

  const lastByte = digest[19];
  const offset = lastByte & 0x0f;
  const windowBytes = digest.slice(offset, offset + 4);
  const maskedFirstByte = windowBytes[0] & 0x7f;
  const maskChangedByte = (windowBytes[0] & 0x80) !== 0;

  // Multiplying instead of shifting the first byte keeps the result clear of
  // JavaScript's signed 32-bit << operator. The mask already guarantees it is
  // below 2^31, so the value is always a positive 31-bit integer.
  const binaryCode =
    maskedFirstByte * 0x1000000 + (windowBytes[1] << 16) + (windowBytes[2] << 8) + windowBytes[3];

  const modulus = 10 ** digits;
  const code = String(binaryCode % modulus).padStart(digits, '0');

  return {
    counter: resolvedCounter,
    counterBytes,
    digest,
    lastByte,
    offset,
    windowBytes,
    maskedFirstByte,
    maskChangedByte,
    binaryCode,
    digits,
    modulus,
    code,
  };
}
