import { useId, useState } from 'react';
import { useAppState } from '../state/AppContext.jsx';

/**
 * A whole-number field that keeps a draft while the user types and only commits
 * a valid value on blur or Enter.
 *
 * @param {{
 *   label: string,
 *   value: number,
 *   validate: (value: number) => string,
 *   onCommit: (value: number) => void,
 * }} props The label, the committed value, a validator returning an error message or '',
 *   and the callback for a valid value.
 * @returns {JSX.Element} The field.
 */
function IntegerField({ label, value, validate, onCommit }) {
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const id = useId();
  const errorId = useId();

  /**
   * Checks the draft and commits it when valid.
   * @returns {void}
   */
  const commit = () => {
    if (draft === null) return;
    const number = Number(draft.trim());
    const message = draft.trim() === '' || !Number.isInteger(number) ? 'Use a whole number.' : validate(number);
    setError(message);
    if (!message) {
      onCommit(number);
      setDraft(null);
    }
  };

  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        className="mono"
        inputMode="numeric"
        value={draft ?? String(value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit();
        }}
      />
      {error ? (
        <p className="error-note" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Drawer section for digits, period X and T0, with a reset button and a compatibility note.
 *
 * @param {{ timeMs: number }} props The effective time, so T0 cannot be set after it.
 * @returns {JSX.Element} The settings panel.
 */
export default function SettingsPanel({ timeMs }) {
  const { state, dispatch } = useAppState();
  const nonDefault = state.digits !== 6 || state.period !== 30 || state.t0 !== 0;
  const latestT0 = Math.floor(timeMs / 1000);

  return (
    <section className="drawer-section" aria-labelledby="settings-title">
      <h2 className="panel-title" id="settings-title">
        Settings
      </h2>

      <fieldset className="segmented">
        <legend className="field-label">Digits</legend>
        {[6, 7, 8].map((digits) => (
          <button key={digits} type="button" aria-pressed={state.digits === digits} onClick={() => dispatch({ type: 'settings/digits', value: digits })}>
            {digits}
          </button>
        ))}
      </fieldset>

      <fieldset className="segmented">
        <legend className="field-label">Period (X), seconds</legend>
        {[15, 30, 60].map((period) => (
          <button key={period} type="button" aria-pressed={state.period === period} onClick={() => dispatch({ type: 'settings/period', value: period })}>
            {period}
          </button>
        ))}
      </fieldset>

      <IntegerField
        label="Custom period, 1 to 300 seconds"
        value={state.period}
        validate={(value) => (value < 1 || value > 300 ? 'The period must be between 1 and 300 seconds.' : '')}
        onCommit={(value) => dispatch({ type: 'settings/period', value })}
      />

      <IntegerField
        label="T0, Unix seconds"
        value={state.t0}
        validate={(value) => {
          if (value < 0) return 'T0 cannot be negative.';
          if (value > latestT0) return `T0 cannot be later than the time on the ring (${latestT0}), or there would be no counter.`;
          return '';
        }}
        onCommit={(value) => dispatch({ type: 'settings/t0', value, nowMs: Date.now() })}
      />

      <button type="button" onClick={() => dispatch({ type: 'settings/reset' })}>
        Reset to defaults
      </button>

      {nonDefault ? (
        <p className="warning-line">Most authenticator apps only support the defaults, so your phone may not match.</p>
      ) : null}
    </section>
  );
}
