import { test } from 'vitest';
import assert from 'node:assert/strict';
import { hotpTrace } from '../hotp.js';
import { decodeBase32 } from '../base32.js';

const rfcSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
const rfcBytes = decodeBase32(rfcSecret).bytes;
const expectedCodes = ['755224', '287082', '359152', '969429', '338314', '254676', '287922', '162583', '399871', '520489'];

const exampleASecret = '12345678901234567890';
const exampleABytes = new TextEncoder().encode(exampleASecret);
const exampleADigest = [0xcc, 0x93, 0xcf, 0x18, 0x50, 0x8d, 0x94, 0x93, 0x4c, 0x64, 0xb6, 0x5d, 0x8b, 0xa7, 0x66, 0x7f, 0xb7, 0xcd, 0xe4, 0xb0];
const exampleBDigest = [0x75, 0xa4, 0x8a, 0x19, 0xd4, 0xcb, 0xe1, 0x00, 0x64, 0x4e, 0x8a, 0xc1, 0x39, 0x7e, 0xea, 0x74, 0x7a, 0x2d, 0x33, 0xab];

test('RFC 4226 Appendix D outputs the expected six-digit codes', async () => {
  for (let i = 0; i < expectedCodes.length; i += 1) {
    const trace = await hotpTrace(rfcBytes, BigInt(i), 6);
    assert.equal(trace.code, expectedCodes[i]);
  }
});

test('Worked example A matches the digest and offset exactly', async () => {
  const trace = await hotpTrace(exampleABytes, 0n, 6);
  assert.deepEqual(Array.from(trace.digest), exampleADigest);
  assert.equal(trace.offset, 0);
  assert.deepEqual(Array.from(trace.windowBytes), [0xcc, 0x93, 0xcf, 0x18]);
  assert.equal(trace.binaryCode, 1284755224); 
  assert.equal(trace.code, '755224');
});

test('Worked example B matches the digest and offset exactly', async () => {
  const trace = await hotpTrace(exampleABytes, 1n, 6);
  assert.deepEqual(Array.from(trace.digest), exampleBDigest);
  assert.equal(trace.offset, 11);
  assert.deepEqual(Array.from(trace.windowBytes), [0xc1, 0x39, 0x7e, 0xea]);
  assert.equal(trace.binaryCode, 1094287082);
  assert.equal(trace.code, '287082');
  assert.equal(trace.maskChangedByte, true);
});

test('binaryCode stays non-negative across random keys and counters', async () => {
  for (let i = 0; i < 1000; i += 1) {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const counter = BigInt(i * 97 + 3);
    const trace = await hotpTrace(randomBytes, counter, 8);
    assert.ok(trace.binaryCode >= 0, `binaryCode became negative on iteration ${i}`);
  }
});

test('Length is preserved for 6, 7 and 8 digit codes including leading zeros', async () => {
  const values = [
    { secret: new TextEncoder().encode('12345678901234567890'), counter: 1n, digits: 6 },
    { secret: new TextEncoder().encode('12345678901234567890'), counter: 2n, digits: 7 },
    { secret: new TextEncoder().encode('12345678901234567890'), counter: 3n, digits: 8 },
  ];

  for (const value of values) {
    const trace = await hotpTrace(value.secret, value.counter, value.digits);
    assert.equal(trace.code.length, value.digits);
    assert.equal(trace.modulus, 10 ** value.digits);
  }
});

test('Leading zeros are kept for 6, 7 and 8 digit codes', async () => {
  const key = new TextEncoder().encode('12345678901234567890');
  assert.equal((await hotpTrace(key, 30n, 6)).code, '026920');
  assert.equal((await hotpTrace(key, 4n, 7)).code, '0338314');
  // RFC 6238 vector for Unix time 1111111109 (counter 0x23523EC).
  assert.equal((await hotpTrace(key, 0x23523ecn, 8)).code, '07081804');
});

test('Digits outside 6 to 8 are rejected', async () => {
  const key = new TextEncoder().encode('12345678901234567890');
  await assert.rejects(() => hotpTrace(key, 0n, 5), RangeError);
});
