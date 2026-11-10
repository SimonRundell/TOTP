import { test } from 'vitest';
import assert from 'node:assert/strict';

import { bytesEqual, bytesToHex, counterToBytes, countChangedBytes, formatByte, nibbleBits } from '../bytes.js';
import { formatOffset, groupCode } from '../format.js';
import { buildShareHash, parseShareHash } from '../shareLink.js';

test('Bytes format in each radix', () => {
  assert.equal(formatByte(0xab, 'hex'), 'AB');
  assert.equal(formatByte(0xab, 'dec'), '171');
  assert.equal(formatByte(0x0b, 'bin'), '00001011');
  assert.deepEqual(nibbleBits(0xc1), ['1100', '0001']);
  assert.equal(bytesToHex([0xc1, 0x39, 0x7e, 0xea]), 'C1 39 7E EA');
});

test('Counters beyond 32 bits encode big-endian', () => {
  assert.deepEqual(Array.from(counterToBytes(0x27bc86aa)), [0, 0, 0, 0, 0x27, 0xbc, 0x86, 0xaa]);
  assert.deepEqual(Array.from(counterToBytes(2 ** 40)), [0, 0, 1, 0, 0, 0, 0, 0]);
});

test('Changed bytes are counted', () => {
  assert.equal(countChangedBytes(Uint8Array.of(1, 2, 3), Uint8Array.of(1, 9, 9)), 2);
  assert.equal(bytesEqual(Uint8Array.of(1), Uint8Array.of(1)), true);
  assert.equal(bytesEqual(null, Uint8Array.of(1)), false);
});

test('Codes are grouped for reading', () => {
  assert.equal(groupCode('123456'), '123 456');
  assert.equal(groupCode('1234567'), '123 4567');
  assert.equal(groupCode('12345678'), '1234 5678');
});

test('Offsets read as signed durations', () => {
  assert.equal(formatOffset(150000), '+00:02:30');
  assert.equal(formatOffset(-3661000), '-01:01:01');
  assert.equal(formatOffset(86400000 * 2 + 5000), '+2d 00:00:05');
});

test('Share links round trip and ignore bad values', () => {
  const hash = buildShareHash({ secretInput: 'JBSWY3DP', digits: 8, period: 60, t0: 100 });
  assert.deepEqual(parseShareHash(`#${hash}`), { secretInput: 'JBSWY3DP', digits: 8, period: 60, t0: 100 });
  assert.deepEqual(parseShareHash('#d=9&p=0&t0=-1'), {});
});
