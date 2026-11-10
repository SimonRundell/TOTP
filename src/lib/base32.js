/**
 * @typedef {Object} Base32Result
 * @property {boolean} ok True when the input decoded cleanly.
 * @property {Uint8Array} bytes Decoded key bytes (empty when not ok).
 * @property {string} normalised Upper-cased input with spaces, hyphens and padding removed.
 * @property {number[]} invalidAt Indexes in the original string of any illegal characters.
 * @property {number} discardedBits Count of trailing bits that did not fill a whole byte.
 */

export const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decodes an RFC 4648 Base32 string while accepting common authenticator formatting.
 *
 * @param {string} input The Base32 text to decode.
 * @returns {Base32Result} The decoded bytes and metadata about invalid characters.
 * @example
 * decodeBase32('JBSWY3DPEHPK3PXP')
 */
export function decodeBase32(input) {
  const source = typeof input === 'string' ? input : '';

  if (source.length === 0) {
    return {
      ok: false,
      bytes: new Uint8Array(0),
      normalised: '',
      invalidAt: [],
      discardedBits: 0,
    };
  }

  let bitBuffer = 0;
  let bitsInBuffer = 0;
  const bytes = [];
  const invalidAt = [];

  for (let i = 0; i < source.length; i += 1) {
    const character = source[i];

    if (/\s|-|=/.test(character)) {
      continue;
    }

    const normalisedChar = character.toUpperCase();
    const value = BASE32_ALPHABET.indexOf(normalisedChar);

    if (value === -1) {
      invalidAt.push(i);
      continue;
    }

    bitBuffer = (bitBuffer << 5) | value;
    bitsInBuffer += 5;

    while (bitsInBuffer >= 8) {
      bitsInBuffer -= 8;
      bytes.push((bitBuffer >> bitsInBuffer) & 0xff);
    }
  }

  const normalised = source
    .toUpperCase()
    .replace(/\s|-/g, '')
    .replace(/=/g, '');

  // A single character holds only five bits, which is not enough for one byte.
  // Web Crypto rejects an empty HMAC key, so treat that as invalid too.
  const result = {
    ok: invalidAt.length === 0 && bytes.length > 0,
    bytes: Uint8Array.from(bytes),
    normalised,
    invalidAt,
    discardedBits: bitsInBuffer,
  };

  return result;
}

/**
 * Encodes byte values as unpadded Base32 using the RFC 4648 alphabet.
 *
 * @param {Uint8Array} bytes The raw bytes to convert.
 * @returns {string} The unpadded Base32 output.
 * @example
 * encodeBase32(new TextEncoder().encode('12345')) // 'GEZDGNBV'
 */
export function encodeBase32(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    return '';
  }

  let buffer = 0;
  let bitsAvailable = 0;
  let output = '';

  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bitsAvailable += 8;

    while (bitsAvailable >= 5) {
      bitsAvailable -= 5;
      output += BASE32_ALPHABET[(buffer >> bitsAvailable) & 0x1f];
    }

    buffer &= (1 << bitsAvailable) - 1;
  }

  if (bitsAvailable > 0) {
    output += BASE32_ALPHABET[(buffer << (5 - bitsAvailable)) & 0x1f];
  }

  return output;
}
