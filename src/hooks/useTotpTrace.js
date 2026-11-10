import { useEffect, useState } from 'react';
import { bytesEqual } from '../lib/bytes.js';
import { hotpTrace } from '../lib/hotp.js';

const WINDOW_OFFSETS = [-2, -1, 0, 1, 2];

/**
 * @typedef {Object} WindowEntry
 * @property {number} k Steps from the current counter, -2 to 2.
 * @property {number} counter The counter for this card.
 * @property {import('../lib/hotp.js').HotpTrace|null} trace Null when the counter would be negative.
 */

/**
 * @typedef {Object} TraceResult
 * @property {import('../lib/hotp.js').HotpTrace|null} current Trace for counter T.
 * @property {import('../lib/hotp.js').HotpTrace|null} previous The trace shown before the last change, for spotting changed bytes.
 * @property {WindowEntry[]} window Traces for T-2 to T+2.
 * @property {boolean} pending True while a newer result is still being computed.
 * @property {string|null} error A message when Web Crypto failed.
 */

const EMPTY = { current: null, previous: null, window: [], pending: false, error: null };

/**
 * Computes the traces for T-2 to T+2 whenever the key, digits or counter change, not every frame.
 * A cancellation flag in the clean-up drops results from older requests, so fast scrubbing
 * never shows a stale code. While a newer request is in flight `pending` is true.
 *
 * @param {Uint8Array|null} key The decoded key, or null when the secret is invalid.
 * @param {number} counter The current counter T.
 * @param {number} digits 6, 7 or 8.
 * @returns {TraceResult} The traces.
 */
export function useTotpTrace(key, counter, digits) {
  const [result, setResult] = useState(() => ({ ...EMPTY, key: null, counter: -1, digits: 0 }));

  useEffect(() => {
    if (!key) {
      return undefined;
    }

    let cancelled = false;

    Promise.all(
      WINDOW_OFFSETS.map((k) => (counter + k < 0 ? null : hotpTrace(key, counter + k, digits))),
    )
      .then((traces) => {
        if (cancelled) {
          return;
        }
        setResult((prior) => {
          const current = traces[2];
          const changed = prior.current && !bytesEqual(prior.current.digest, current.digest);
          return {
            key,
            counter,
            digits,
            current,
            previous: changed ? prior.current : prior.previous,
            window: WINDOW_OFFSETS.map((k, i) => ({ k, counter: counter + k, trace: traces[i] })),
            error: null,
          };
        });
      })
      .catch((error) => {
        if (!cancelled) {
          setResult({ ...EMPTY, key, counter, digits, error: error.message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [key, counter, digits]);

  if (!key) {
    return EMPTY;
  }

  return {
    current: result.current,
    previous: result.previous,
    window: result.window,
    error: result.error,
    pending: result.key !== key || result.counter !== counter || result.digits !== digits,
  };
}
