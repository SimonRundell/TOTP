import { defaults } from '../config/defaults.js';
import { parseShareHash } from '../lib/shareLink.js';
import { MAX_UNIX_SECONDS } from '../lib/totp.js';

export const RFC_SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
export const STEP_COUNT = 5;

/**
 * @typedef {Object} AppState
 * @property {string} secretInput Raw secret text as typed.
 * @property {6|7|8} digits Code length.
 * @property {number} period Period X in seconds, 1 to 300.
 * @property {number} t0 Epoch offset T0 in Unix seconds.
 * @property {'live'|'scrubbed'} timeMode Whether the clock follows real time.
 * @property {number|null} scrubTimeMs The chosen time when scrubbed.
 * @property {'live'|'steps'} viewMode Live view or guided step-through.
 * @property {number} stepIndex Active stage in step-through mode, 0 to 4.
 * @property {'hex'|'dec'|'bin'} radix How bytes are displayed.
 * @property {0|1|2} windowSize Verification tolerance in steps either side.
 * @property {string} issuer Issuer for the otpauth URI.
 * @property {string} account Account name for the otpauth URI.
 */

/**
 * Builds the starting state from the defaults plus anything in a shared link.
 *
 * @param {string} [hash] The URL fragment, if any.
 * @returns {AppState} The initial state.
 */
export function createInitialState(hash = '') {
  return { ...defaults, ...parseShareHash(hash) };
}

/**
 * Keeps a scrubbed time at or after T0, since earlier times have no counter, and
 * at or before the last moment a JavaScript date can represent.
 *
 * @param {number} ms The requested time in milliseconds.
 * @param {number} t0 T0 in seconds.
 * @returns {number} The clamped time.
 */
function clampToT0(ms, t0) {
  return Math.min(Math.max(ms, t0 * 1000), MAX_UNIX_SECONDS * 1000);
}

/**
 * Puts the clock into scrubbed mode at a given moment.
 *
 * @param {AppState} state The current state.
 * @param {number} ms The moment to freeze on.
 * @returns {AppState} The updated state.
 */
function scrubTo(state, ms) {
  return { ...state, timeMode: 'scrubbed', scrubTimeMs: clampToT0(ms, state.t0) };
}

/**
 * The single reducer for the app. Every action that depends on the current time
 * carries `nowMs` so the reducer stays pure.
 *
 * @param {AppState} state The current state.
 * @param {{ type: string, [key: string]: any }} action The action to apply.
 * @returns {AppState} The next state.
 */
export function reducer(state, action) {
  switch (action.type) {
    case 'secret/set':
      return { ...state, secretInput: action.value };

    case 'settings/digits':
      return [6, 7, 8].includes(action.value) ? { ...state, digits: action.value } : state;

    case 'settings/period': {
      const period = action.value;
      if (!Number.isInteger(period) || period < 1 || period > 300) {
        return state;
      }
      return { ...state, period };
    }

    case 'settings/t0': {
      const effectiveMs = state.timeMode === 'scrubbed' ? state.scrubTimeMs : action.nowMs;
      const t0 = action.value;
      if (!Number.isInteger(t0) || t0 < 0 || t0 * 1000 > effectiveMs) {
        return state;
      }
      return { ...state, t0 };
    }

    case 'settings/reset':
      return {
        ...state,
        digits: defaults.digits,
        period: defaults.period,
        t0: defaults.t0,
      };

    case 'time/scrubTo':
      return scrubTo(state, action.ms);

    case 'time/shift': {
      const base = state.timeMode === 'scrubbed' ? state.scrubTimeMs : action.nowMs;
      return scrubTo(state, base + action.deltaMs);
    }

    case 'time/live':
      return { ...state, timeMode: 'live', scrubTimeMs: null };

    case 'view/set':
      if (action.mode === state.viewMode) {
        return state;
      }
      if (action.mode === 'steps') {
        // Freeze time so the values stay still while the teacher talks.
        const frozen = state.timeMode === 'scrubbed' ? state.scrubTimeMs : action.nowMs;
        return { ...scrubTo(state, frozen), viewMode: 'steps', stepIndex: 0 };
      }
      return { ...state, viewMode: 'live', timeMode: 'live', scrubTimeMs: null };

    case 'step/set':
      return { ...state, stepIndex: Math.min(STEP_COUNT - 1, Math.max(0, action.index)) };

    case 'radix/set':
      return ['hex', 'dec', 'bin'].includes(action.value) ? { ...state, radix: action.value } : state;

    case 'window/set':
      return [0, 1, 2].includes(action.value) ? { ...state, windowSize: action.value } : state;

    case 'qr/issuer':
      return { ...state, issuer: action.value };

    case 'qr/account':
      return { ...state, account: action.value };

    case 'vector/load':
      return {
        ...state,
        secretInput: RFC_SECRET,
        digits: 8,
        period: 30,
        t0: 0,
        timeMode: 'scrubbed',
        scrubTimeMs: action.unixSeconds * 1000,
      };

    default:
      return state;
  }
}
