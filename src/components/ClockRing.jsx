import { useId, useRef, useState } from 'react';
import { useRingDrag } from '../hooks/useRingDrag.js';
import { formatOffset, groupCode, toLocalInputValue } from '../lib/format.js';
import { polarPoint, stepFraction } from '../lib/ringMath.js';
import { MAX_UNIX_SECONDS } from '../lib/totp.js';
import { useAppState } from '../state/AppContext.jsx';

const SIZE = 400;
const CENTRE = SIZE / 2;
const TRACK_RADIUS = 150;
const LABEL_RADIUS = 184;
const CIRCUMFERENCE = 2 * Math.PI * TRACK_RADIUS;

/**
 * Builds the tick marks: one per second for periods up to 60, otherwise one per tenth of the period.
 *
 * @param {number} period The period X in seconds.
 * @returns {JSX.Element[]} The tick lines.
 */
function buildTicks(period) {
  const count = period <= 60 ? period : 10;
  const majorEvery = period <= 60 ? Math.max(1, Math.round(period / 6)) : 1;
  return Array.from({ length: count }, (_, index) => {
    const angle = (2 * Math.PI * index) / count;
    const major = index % majorEvery === 0;
    const inner = polarPoint(CENTRE, CENTRE, major ? 160 : 163, angle);
    const outer = polarPoint(CENTRE, CENTRE, 171, angle);
    return (
      <line
        key={index}
        x1={inner.x}
        y1={inner.y}
        x2={outer.x}
        y2={outer.y}
        className={major ? 'ring-tick is-major' : 'ring-tick'}
      />
    );
  });
}

/**
 * Buttons, status chip and jump fields that sit below the ring.
 *
 * @param {{ realMs: number, timeMs: number }} props The real time and the effective time, in milliseconds.
 * @returns {JSX.Element} The scrub controls.
 */
function ScrubControls({ realMs, timeMs }) {
  const { state, dispatch } = useAppState();
  const [unixDraft, setUnixDraft] = useState('');
  const [dateDraft, setDateDraft] = useState('');
  const [jumpError, setJumpError] = useState('');
  const unixId = useId();
  const dateId = useId();
  const isScrubbed = state.timeMode === 'scrubbed';
  const atT0 = isScrubbed && state.scrubTimeMs === state.t0 * 1000;

  /**
   * Moves the clock by a number of seconds.
   * @param {number} seconds Seconds to add, negative to go back.
   * @returns {void}
   */
  const shift = (seconds) => dispatch({ type: 'time/shift', deltaMs: seconds * 1000, nowMs: Date.now() });

  /**
   * Scrubs to a moment after checking it is not before T0.
   * @param {number} ms The moment in milliseconds.
   * @returns {void}
   */
  const jumpTo = (ms) => {
    if (!Number.isFinite(ms)) {
      setJumpError('That is not a time I can use.');
      return;
    }
    if (Math.abs(ms) > MAX_UNIX_SECONDS * 1000) {
      setJumpError('That is too far away. Dates stop at about 273,000 years from 1970.');
      return;
    }
    setJumpError(ms < state.t0 * 1000 ? `That is before T0 (${state.t0}), so the clock stops at T0 instead.` : '');
    dispatch({ type: 'time/scrubTo', ms });
  };

  /**
   * Handles the Unix time form.
   * @param {SubmitEvent} event The submission.
   * @returns {void}
   */
  const submitUnix = (event) => {
    event.preventDefault();
    const value = Number(unixDraft.trim());
    if (unixDraft.trim() === '' || !Number.isInteger(value)) {
      setJumpError('Type a whole number of seconds.');
      return;
    }
    jumpTo(value * 1000);
  };

  /**
   * Handles the date and time form.
   * @param {SubmitEvent} event The submission.
   * @returns {void}
   */
  const submitDate = (event) => {
    event.preventDefault();
    jumpTo(new Date(dateDraft).getTime());
  };

  return (
    <div className="scrub-controls">
      <div className="button-row is-centred">
        <button type="button" onClick={() => shift(-state.period)}>
          −1 step
        </button>
        <button type="button" onClick={() => shift(-1)}>
          −1 s
        </button>
        <button type="button" onClick={() => shift(1)}>
          +1 s
        </button>
        <button type="button" onClick={() => shift(state.period)}>
          +1 step
        </button>
      </div>

      <div className="button-row is-centred">
        <span className={`status-chip ${isScrubbed ? 'is-scrubbed' : 'is-live'}`} role="status">
          {isScrubbed ? `◆ SCRUBBED ${formatOffset(timeMs - realMs)}` : '● LIVE'}
        </span>
        {isScrubbed ? (
          <button type="button" className="return-live" onClick={() => dispatch({ type: 'time/live' })}>
            Return to live
          </button>
        ) : null}
      </div>

      {atT0 ? <p className="info-note">This is T0, where counting starts. There is no counter before it, so the clock cannot go further back.</p> : null}

      <form className="jump-form" onSubmit={submitUnix}>
        <label htmlFor={unixId} className="field-label">
          Jump to Unix time
        </label>
        <input
          id={unixId}
          className="mono"
          inputMode="numeric"
          value={unixDraft}
          placeholder={String(Math.floor(timeMs / 1000))}
          onChange={(event) => setUnixDraft(event.target.value)}
        />
        <button type="submit">Go</button>
      </form>
      <form className="jump-form" onSubmit={submitDate}>
        <label htmlFor={dateId} className="field-label">
          Jump to local date and time
        </label>
        <input
          id={dateId}
          type="datetime-local"
          step="1"
          value={dateDraft || toLocalInputValue(timeMs)}
          // Freeze the field's value on focus so a live clock does not overwrite half-typed input.
          onFocus={() => setDateDraft((draft) => draft || toLocalInputValue(timeMs))}
          onChange={(event) => setDateDraft(event.target.value)}
        />
        <button type="submit">Go</button>
      </form>
      {jumpError ? <p className="error-note">{jumpError}</p> : null}
    </div>
  );
}

/**
 * The centrepiece: a ring where one revolution is one period. It runs live and can be
 * dragged, or moved with the keyboard, to scrub through time.
 *
 * @param {{
 *   timeMs: number,
 *   realMs: number,
 *   step: { counter: number, secondsIntoStep: number, secondsRemaining: number },
 *   code: string|null,
 *   announcedCode: string|null,
 * }} props The effective and real time, the current step, the code to show (null while
 *   computing or invalid) and the code to announce to screen readers.
 * @returns {JSX.Element} The ring and its controls.
 */
export default function ClockRing({ timeMs, realMs, step, code, announcedCode }) {
  const { state, dispatch } = useAppState();
  const svgRef = useRef(null);
  const { isDragging, handlers } = useRingDrag(svgRef, state.period, dispatch);

  const fraction = stepFraction(timeMs, state.period, state.t0);
  const angle = fraction * 2 * Math.PI;
  const handle = polarPoint(CENTRE, CENTRE, TRACK_RADIUS, angle);
  const isEnding = step.secondsRemaining <= 5;
  const digits = state.digits;

  /**
   * Keyboard control: Left and Right move one second, Shift moves one step, Home returns to live.
   * @param {KeyboardEvent} event The key press.
   * @returns {void}
   */
  const onKeyDown = (event) => {
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowUp';
    const back = event.key === 'ArrowLeft' || event.key === 'ArrowDown';
    if (forward || back) {
      event.preventDefault();
      const seconds = event.shiftKey ? state.period : 1;
      dispatch({ type: 'time/shift', deltaMs: (forward ? seconds : -seconds) * 1000, nowMs: Date.now() });
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault();
      dispatch({ type: 'time/shift', deltaMs: (event.key === 'PageUp' ? 1 : -1) * state.period * 1000, nowMs: Date.now() });
    } else if (event.key === 'Home') {
      event.preventDefault();
      dispatch({ type: 'time/live' });
    }
  };

  return (
    <section className="panel ring-panel" aria-label="Clock ring">
      <svg
        ref={svgRef}
        className={`clock-ring ${isDragging ? 'is-dragging' : ''} ${isEnding ? 'is-ending' : ''}`}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="slider"
        tabIndex={0}
        aria-label="Time within the current step. Drag, or use the arrow keys."
        aria-valuemin={0}
        aria-valuemax={state.period}
        aria-valuenow={step.secondsIntoStep}
        aria-valuetext={`${step.secondsIntoStep} seconds into step ${step.counter}, ${step.secondsRemaining} seconds remaining`}
        onKeyDown={onKeyDown}
        {...handlers}
      >
        <defs>
          <path
            id="ring-label-path"
            d={`M ${CENTRE - LABEL_RADIUS} ${CENTRE} A ${LABEL_RADIUS} ${LABEL_RADIUS} 0 0 1 ${CENTRE + LABEL_RADIUS} ${CENTRE}`}
          />
        </defs>
        <circle cx={CENTRE} cy={CENTRE} r={TRACK_RADIUS - 20} className="ring-face" />
        <circle cx={CENTRE} cy={CENTRE} r={TRACK_RADIUS} className="ring-track" />
        {/* Remounts whenever the counter changes, so the flash animation plays once per boundary. */}
        <circle key={step.counter} cx={CENTRE} cy={CENTRE} r={TRACK_RADIUS} className="ring-flash" />
        <circle
          cx={CENTRE}
          cy={CENTRE}
          r={TRACK_RADIUS}
          className="ring-progress"
          strokeDasharray={`${fraction * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          transform={`rotate(-90 ${CENTRE} ${CENTRE})`}
        />
        <g>{buildTicks(state.period)}</g>
        <text className="ring-counter">
          <textPath href="#ring-label-path" startOffset="50%" textAnchor="middle">
            T = {step.counter}
          </textPath>
        </text>
        <circle cx={handle.x} cy={handle.y} r={13} className="ring-handle" />
        <text x={CENTRE} y={CENTRE + 4} className={`ring-code digits-${digits} ${code ? '' : 'is-pending'}`} textAnchor="middle">
          {code ? groupCode(code) : '·'.repeat(digits)}
        </text>
        <text x={CENTRE} y={CENTRE + 48} className="ring-remaining" textAnchor="middle">
          {step.secondsRemaining} s remaining
        </text>
      </svg>
      <p className="sr-only" aria-live="polite">
        {announcedCode && !isDragging ? `Current code ${announcedCode.split('').join(' ')}` : ''}
      </p>
      <ScrubControls realMs={realMs} timeMs={timeMs} />
    </section>
  );
}
