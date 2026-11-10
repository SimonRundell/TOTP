/**
 * Byte and number helpers shared by the library and the UI.
 * Pure JavaScript with no React imports.
 */

/**
 * Formats one byte in the chosen radix.
 *
 * @param {number} value A byte from 0 to 255.
 * @param {'hex'|'dec'|'bin'} radix The number base to display.
 * @returns {string} Two hex digits, a decimal number, or eight bits.
 * @example
 * formatByte(171, 'hex') // 'AB'
 * formatByte(171, 'bin') // '10101011'
 */
export function formatByte(value, radix) {
  if (radix === 'dec') {
    return String(value);
  }

  if (radix === 'bin') {
    return value.toString(2).padStart(8, '0');
  }

  return value.toString(16).padStart(2, '0').toUpperCase();
}

/**
 * Writes a byte as two groups of four bits so it is easier to read aloud.
 *
 * @param {number} value A byte from 0 to 255.
 * @returns {string[]} The high and low nibbles as bit strings.
 * @example
 * nibbleBits(0xc1) // ['1100', '0001']
 */
export function nibbleBits(value) {
  const bits = value.toString(2).padStart(8, '0');
  return [bits.slice(0, 4), bits.slice(4)];
}

/**
 * Formats a list of bytes as upper-case hex separated by spaces.
 *
 * @param {Uint8Array|number[]} bytes The bytes to format.
 * @returns {string} Hex text such as 'C1 39 7E EA'.
 * @example
 * bytesToHex([0xc1, 0x39]) // 'C1 39'
 */
export function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => formatByte(byte, 'hex')).join(' ');
}

/**
 * Encodes a counter as an 8-byte big-endian unsigned integer.
 *
 * @param {number|bigint} counter A non-negative counter.
 * @returns {Uint8Array} Eight bytes, most significant first.
 * @example
 * counterToBytes(1) // Uint8Array [0, 0, 0, 0, 0, 0, 0, 1]
 */
export function counterToBytes(counter) {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setBigUint64(0, BigInt(counter), false);
  return bytes;
}

/**
 * Converts plain text to bytes using UTF-8, which matches ASCII for ordinary characters.
 *
 * @param {string} text The text to convert.
 * @returns {Uint8Array} The encoded bytes.
 * @example
 * textToBytes('12') // Uint8Array [49, 50]
 */
export function textToBytes(text) {
  return new TextEncoder().encode(text);
}

/**
 * Counts how many positions differ between two byte arrays of the same length.
 *
 * @param {Uint8Array} a The first array.
 * @param {Uint8Array} b The second array.
 * @returns {number} The number of positions whose bytes differ.
 * @example
 * countChangedBytes(Uint8Array.of(1, 2), Uint8Array.of(1, 3)) // 1
 */
export function countChangedBytes(a, b) {
  let changed = 0;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      changed += 1;
    }
  }
  return changed;
}

/**
 * Compares two byte arrays for equality.
 *
 * @param {Uint8Array|null|undefined} a The first array.
 * @param {Uint8Array|null|undefined} b The second array.
 * @returns {boolean} True when both exist and hold the same bytes.
 * @example
 * bytesEqual(Uint8Array.of(1), Uint8Array.of(1)) // true
 */
export function bytesEqual(a, b) {
  if (!a || !b || a.length !== b.length) {
    return false;
  }
  return countChangedBytes(a, b) === 0;
}
