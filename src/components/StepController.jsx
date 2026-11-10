import { useEffect, useEffectEvent } from 'react';
import { steps } from '../content/steps.js';
import { useAppState } from '../state/AppContext.jsx';
import Caption from './Caption.jsx';

/**
 * Checks whether a key press belongs to a control that already uses the arrow keys.
 *
 * @param {EventTarget|null} target The element that received the key.
 * @returns {boolean} True for text fields, selects and the clock ring.
 */
function ownsArrowKeys(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('input, textarea, select, [role="slider"]'));
}

/**
 * Back, Next, a five-dot progress indicator and Exit to live, plus the caption.
 * Left and Right arrow keys move between stages when focus is not on the ring or a field.
 *
 * @returns {JSX.Element} The step controller.
 */
export default function StepController() {
  const { state, dispatch } = useAppState();
  const index = state.stepIndex;
  const last = steps.length - 1;

  /**
   * Moves between stages with the arrow keys.
   * @param {KeyboardEvent} event The key press.
   * @returns {void}
   */
  const onKey = useEffectEvent((event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || ownsArrowKeys(event.target)) return;
    if (event.key === 'ArrowRight') dispatch({ type: 'step/set', index: index + 1 });
    if (event.key === 'ArrowLeft') dispatch({ type: 'step/set', index: index - 1 });
  });

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <section className="panel step-controller" aria-label="Step-through">
      <Caption step={steps[index]} />
      <div className="step-nav">
        <button type="button" onClick={() => dispatch({ type: 'step/set', index: index - 1 })} disabled={index === 0}>
          Back
        </button>
        <ol className="step-dots" aria-label={`Stage ${index + 1} of ${steps.length}`}>
          {steps.map((step, i) => (
            <li key={step.id}>
              <button
                type="button"
                className={`step-dot ${i === index ? 'is-current' : ''} ${i < index ? 'is-done' : ''}`}
                aria-label={`Stage ${i + 1}: ${step.title}`}
                aria-current={i === index ? 'step' : undefined}
                onClick={() => dispatch({ type: 'step/set', index: i })}
              />
            </li>
          ))}
        </ol>
        <button type="button" onClick={() => dispatch({ type: 'step/set', index: index + 1 })} disabled={index === last}>
          Next
        </button>
        <button type="button" onClick={() => dispatch({ type: 'view/set', mode: 'live' })}>
          Exit to live
        </button>
      </div>
    </section>
  );
}
