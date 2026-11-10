import { test } from 'vitest';
import assert from 'node:assert/strict';

import { decodeBase32, encodeBase32 } from '../base32.js';

const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
const expectedBytes = Uint8Array.from([49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 48]);

test('Base32 decodes the RFC example secret', () => {
  const decoded = decodeBase32(secret);
  assert.equal(decoded.ok, true);
  assert.deepEqual(Array.from(decoded.bytes), Array.from(expectedBytes));
});

test('Base32 round trips lengths one to thirty-two', () => {
  for (let length = 1; length <= 32; length += 1) {
    const original = new Uint8Array(Array.from({ length }, (_, i) => i % 255));
    const encoded = encodeBase32(original);
    const decoded = decodeBase32(encoded);
    assert.equal(decoded.ok, true);
    assert.deepEqual(Array.from(decoded.bytes), Array.from(original));
  }
});

test('Base32 accepts lowercase, spaces, hyphens and padding', () => {
  const decoded = decodeBase32(' gezdgnbv-gy3tqojq \n');
  assert.equal(decoded.ok, true);
  assert.deepEqual(Array.from(decoded.bytes.slice(0, 8)), [49, 50, 51, 52, 53, 54, 55, 56]);
});

test('Base32 reports illegal characters by original index', () => {
  const result = decodeBase32('JBSWY3DP0');
  assert.deepEqual(result.invalidAt, [8]);
  assert.equal(result.ok, false);
});

test('Empty Base32 string is rejected', () => {
  const result = decodeBase32('');
  assert.equal(result.ok, false);
  assert.equal(result.bytes.length, 0);
});

test('A single character is too short to make a byte', () => {
  const result = decodeBase32('A');
  assert.equal(result.ok, false);
  assert.equal(result.discardedBits, 5);
});

test('Padding is accepted and stripped from the normalised form', () => {
  const result = decodeBase32('GEZDGNBV====');
  assert.equal(result.ok, true);
  assert.equal(result.normalised, 'GEZDGNBV');
});
