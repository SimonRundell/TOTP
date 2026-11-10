import { expect, test } from 'vitest';
import { MAX_UNIX_SECONDS } from '../lib/totp.js';
import { createInitialState, reducer } from './reducer.js';

const NOW = 1_800_000_000_000;

test('Scrubbing is clamped to T0 and to the last representable date', () => {
  const state = createInitialState('');
  expect(reducer(state, { type: 'time/scrubTo', ms: -5000 }).scrubTimeMs).toBe(0);
  expect(reducer(state, { type: 'time/scrubTo', ms: 1e30 }).scrubTimeMs).toBe(MAX_UNIX_SECONDS * 1000);
  // The clamped value must still format as a date, or the readout would crash the app.
  const clamped = reducer(state, { type: 'time/scrubTo', ms: 1e30 }).scrubTimeMs;
  expect(() => new Date(clamped).toISOString()).not.toThrow();
});

test('Choosing the view that is already showing changes nothing', () => {
  const live = createInitialState('');
  const scrubbed = reducer(live, { type: 'time/scrubTo', ms: 59000 });
  expect(reducer(scrubbed, { type: 'view/set', mode: 'live', nowMs: NOW })).toBe(scrubbed);

  const steps = reducer(scrubbed, { type: 'view/set', mode: 'steps', nowMs: NOW });
  const moved = reducer(steps, { type: 'step/set', index: 3 });
  expect(reducer(moved, { type: 'view/set', mode: 'steps', nowMs: NOW })).toBe(moved);
});

test('Step-through freezes the current time and Exit returns to live', () => {
  const steps = reducer(createInitialState(''), { type: 'view/set', mode: 'steps', nowMs: NOW });
  expect(steps.timeMode).toBe('scrubbed');
  expect(steps.scrubTimeMs).toBe(NOW);
  const live = reducer(steps, { type: 'view/set', mode: 'live', nowMs: NOW });
  expect(live.timeMode).toBe('live');
});

test('Settings reject invalid values', () => {
  const state = createInitialState('');
  expect(reducer(state, { type: 'settings/digits', value: 9 })).toBe(state);
  expect(reducer(state, { type: 'settings/period', value: 0 })).toBe(state);
  expect(reducer(state, { type: 'settings/period', value: 301 })).toBe(state);
  expect(reducer(state, { type: 'settings/t0', value: NOW, nowMs: NOW })).toBe(state);
  expect(reducer(state, { type: 'settings/t0', value: 100, nowMs: NOW }).t0).toBe(100);
});

test('Loading an RFC vector sets the secret, 8 digits and the time', () => {
  const state = reducer(createInitialState(''), { type: 'vector/load', unixSeconds: 59 });
  expect(state).toMatchObject({ digits: 8, period: 30, t0: 0, timeMode: 'scrubbed', scrubTimeMs: 59000 });
});
