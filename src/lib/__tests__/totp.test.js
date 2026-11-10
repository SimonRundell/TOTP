import { test } from 'vitest';
import assert from 'node:assert/strict';

import { timeToCounter, totpTrace } from '../totp.js';
import { decodeBase32 } from '../base32.js';

const secret = decodeBase32('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ').bytes;
const vectors = [
  { unixSeconds: 59, expected: '94287082' },
  { unixSeconds: 1111111109, expected: '07081804' },
  { unixSeconds: 1111111111, expected: '14050471' },
  { unixSeconds: 1234567890, expected: '89005924' },
  { unixSeconds: 2000000000, expected: '69279037' },
  { unixSeconds: 20000000000, expected: '65353130' },
];

test('TOTP matches all RFC 6238 Appendix B vectors', async () => {
  for (const vector of vectors) {
    const trace = await totpTrace(secret, vector.unixSeconds, { digits: 8, period: 30, t0: 0 });
    assert.equal(trace.code, vector.expected);
  }
});

test('timeToCounter handles non-zero T0 and different periods', () => {
  assert.deepEqual(timeToCounter(120, 30, 60), { counter: 2, secondsIntoStep: 0, secondsRemaining: 30, stepStart: 120 });
  assert.deepEqual(timeToCounter(100, 15, 30), { counter: 4, secondsIntoStep: 10, secondsRemaining: 5, stepStart: 90 });
  assert.deepEqual(timeToCounter(200, 60, 0), { counter: 3, secondsIntoStep: 20, secondsRemaining: 40, stepStart: 180 });
});

test('A time beyond 32 bits still yields the expected counter bytes', async () => {
  const trace = await totpTrace(secret, 20000000000, { digits: 8, period: 30, t0: 0 });
  const counterBytes = Array.from(trace.counterBytes);
  assert.deepEqual(counterBytes, [0x00, 0x00, 0x00, 0x00, 0x27, 0xbc, 0x86, 0xaa]);
});

test('totpTrace honours a non-zero T0 and rejects times before it', async () => {
  const trace = await totpTrace(secret, 1000 + 59, { digits: 8, period: 30, t0: 1000 });
  assert.equal(trace.code, '94287082');
  await assert.rejects(() => totpTrace(secret, 999, { digits: 6, period: 30, t0: 1000 }), RangeError);
});
