import { memo, useId, useState } from 'react';
import { useAppState } from '../state/AppContext.jsx';

/**
 * Labels a window position, such as "T", "T − 1" or "T + 2".
 *
 * @param {number} k Steps from the current counter.
 * @returns {string} The label.
 */
function stepLabel(k) {
  if (k === 0) return 'T';
  return k < 0 ? `T − ${-k}` : `T + ${k}`;
}

/**
 * Describes the result of checking a typed code against the window.
 *
 * @param {number|null} k The matching position, or null when nothing matched.
 * @param {number} period The period X in seconds.
 * @param {number} tolerance Steps either side the server accepts.
 * @returns {{ text: string, ok: boolean }} The message and whether the code would be accepted.
 */
function describeMatch(k, period, tolerance) {
  if (k === null) {
    return { text: 'No match within the window.', ok: false };
  }
  const accepted = Math.abs(k) <= tolerance;
  if (k === 0) {
    return { text: 'Matches T. This is the current code and would be accepted.', ok: true };
  }
  const seconds = Math.abs(k) * period;
  const when = k < 0 ? `${seconds} seconds old` : `${seconds} seconds ahead of the server's clock`;
  const verdict = accepted ? (k < 0 ? 'would still be accepted' : 'would be accepted') : 'would be rejected';
  return { text: `Matches ${stepLabel(k)}. This code is ${when} and ${verdict}.`, ok: accepted };
}

/**
 * Five cards for T − 2 to T + 2, a tolerance control and a code checker, showing how
 * a server allows for clock drift and slow typing.
 *
 * @param {{ entries: import('../hooks/useTotpTrace.js').WindowEntry[], pending: boolean }} props
 *   The traces for each window position and whether a newer result is computing.
 * @returns {JSX.Element} The verification window.
 */
function VerificationWindow({ entries, pending }) {
  const { state, dispatch } = useAppState();
  const [guess, setGuess] = useState('');
  const guessId = useId();
  const tolerance = state.windowSize;

  const cleaned = guess.replace(/\s/g, '');
  const ready = cleaned.length === state.digits && !pending;
  const match = ready ? (entries.find((entry) => entry.trace?.code === cleaned)?.k ?? null) : undefined;
  const result = match === undefined ? null : describeMatch(match, state.period, tolerance);

  return (
    <section className="panel verification" aria-labelledby="verification-title">
      <div className="verification-head">
        <h2 className="panel-title" id="verification-title">
          Verification window
        </h2>
        <fieldset className="segmented">
          <legend className="field-label">Server tolerance</legend>
          {[0, 1, 2].map((size) => (
            <button
              key={size}
              type="button"
              aria-pressed={tolerance === size}
              onClick={() => dispatch({ type: 'window/set', value: size })}
            >
              ±{size} {size === 1 ? 'step' : 'steps'}
            </button>
          ))}
        </fieldset>
      </div>

      {entries.length === 0 ? <p className="hint">Waiting for a valid secret.</p> : null}
      <ol className={`window-cards ${pending ? 'is-pending' : ''}`}>
        {entries.map(({ k, counter, trace }) => {
          const accepted = Math.abs(k) <= tolerance;
          const start = counter * state.period + state.t0;
          return (
            <li
              key={k}
              className={`window-card ${k === 0 ? 'is-current' : ''} ${accepted ? 'is-accepted' : 'is-rejected'} ${match === k ? 'is-match' : ''}`}
            >
              <span className="window-label">{stepLabel(k)}</span>
              <span className="mono window-code">{trace ? trace.code : '—'}</span>
              <span className="mono window-meta">T = {counter >= 0 ? counter : 'none'}</span>
              <span className="mono window-meta">
                {counter >= 0 ? `starts ${new Date(start * 1000).toLocaleTimeString('en-GB')}` : 'before T0'}
              </span>
              <span className="window-verdict">{accepted ? '✓ accepted' : '✕ rejected'}</span>
            </li>
          );
        })}
      </ol>

      <div className="verify-row">
        <label htmlFor={guessId} className="field-label">
          Verify a code
        </label>
        <input
          id={guessId}
          className="mono verify-input"
          inputMode="numeric"
          autoComplete="off"
          maxLength={state.digits + 2}
          value={guess}
          placeholder={'0'.repeat(state.digits)}
          onChange={(event) => setGuess(event.target.value)}
        />
        <p className={`verify-result ${result ? (result.ok ? 'is-ok' : 'is-bad') : ''}`} role="status">
          {result ? (
            <>
              <span aria-hidden="true">{result.ok ? '✓ ' : '✕ '}</span>
              {result.text}
            </>
          ) : (
            `Type a ${state.digits}-digit code to check it against the window.`
          )}
        </p>
      </div>

      <p className="hint">
        Why a window? Clocks drift, and people type slowly, so a server usually accepts a step or two either side.
      </p>
      <p className="hint">A real server should also refuse any code it has already accepted once, so a stolen code cannot be replayed.</p>
    </section>
  );
}

export default memo(VerificationWindow);
