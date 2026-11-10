import { test } from 'vitest';
import assert from 'node:assert/strict';

import { angleDeltaToMs, normaliseAngleDelta, pointerAngle, polarPoint, stepFraction } from '../ringMath.js';

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} is not close to ${b}`);

test('Clockwise across 12 o\'clock gives a small positive delta', () => {
  // From just before 12 (350 degrees) to just after (10 degrees).
  const before = (350 / 360) * Math.PI * 2;
  const after = (10 / 360) * Math.PI * 2;
  close(normaliseAngleDelta(after - before), (20 / 360) * Math.PI * 2);
});

test('Anticlockwise across 12 o\'clock gives a small negative delta', () => {
  const before = (10 / 360) * Math.PI * 2;
  const after = (350 / 360) * Math.PI * 2;
  close(normaliseAngleDelta(after - before), (-20 / 360) * Math.PI * 2);
});

test('Deltas are normalised into (-pi, pi]', () => {
  close(normaliseAngleDelta(Math.PI * 1.5), -Math.PI * 0.5);
  close(normaliseAngleDelta(-Math.PI * 1.5), Math.PI * 0.5);
  close(normaliseAngleDelta(Math.PI), Math.PI);
  close(normaliseAngleDelta(-Math.PI), Math.PI);
});

test('Pointer angles are measured clockwise from 12 o\'clock', () => {
  close(pointerAngle(0, -1), 0);
  close(pointerAngle(1, 0), Math.PI / 2);
  close(pointerAngle(0, 1), Math.PI);
  close(pointerAngle(-1, 0), Math.PI * 1.5);
});

test('Half a turn is half a period', () => {
  close(angleDeltaToMs(Math.PI, 30), 15000);
  close(angleDeltaToMs(-Math.PI * 2, 60), -60000);
});

test('stepFraction and polarPoint agree with the angle model', () => {
  close(stepFraction(45000, 30, 0), 0.5);
  close(stepFraction(1015000, 30, 1000), 0.5);
  const point = polarPoint(100, 100, 50, Math.PI / 2);
  close(point.x, 150);
  close(point.y, 100);
});
