import { useEffect, useEffectEvent } from 'react';
import { overview, steps } from '../content/steps.js';
import { useAppState } from '../state/AppContext.jsx';

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
 * The teaching card. It is always on screen beside the clock ring. It explains the whole
 * process, then one stage at a time: why it exists, what happens, what to look at, and a
 * question for the class. The stage buttons move the highlight on the pipeline.
 * In step-through mode the left and right arrow keys also move between stages when focus
 * is not on the ring or a text field.
 *
 * @returns {JSX.Element} The teaching card.
 */
export default function TeachingCard() {
  const { state, dispatch } = useAppState();
  const index = state.stepIndex;
  const last = steps.length - 1;
  const step = steps[index];
  const inSteps = state.viewMode === 'steps';

  /**
   * Moves between stages with the arrow keys, in step-through mode only.
   * @param {KeyboardEvent} event The key press.
   * @returns {void}
   */
  const onKey = useEffectEvent((event) => {
    if (!inSteps || event.altKey || event.ctrlKey || event.metaKey || ownsArrowKeys(event.target)) return;
    if (event.key === 'ArrowRight') dispatch({ type: 'step/set', index: index + 1 });
    if (event.key === 'ArrowLeft') dispatch({ type: 'step/set', index: index - 1 });
  });

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <section className="panel teaching-card" aria-label="Teaching card">
      <details className="overview" open>
        <summary>{overview.title}</summary>
        {overview.paragraphs.map((text) => (
          <p key={text}>{text}</p>
        ))}
        <p className="formula mono">{overview.recipe}</p>
      </details>

      <div className="step-nav">
        <button type="button" onClick={() => dispatch({ type: 'step/set', index: index - 1 })} disabled={index === 0}>
          Back
        </button>
        <ol className="stage-tabs" aria-label={`Stage ${index + 1} of ${steps.length}`}>
          {steps.map((item, i) => (
            <li key={item.id}>
              <button
                type="button"
                className="stage-tab"
                aria-label={`Stage ${item.id}: ${item.title}`}
                aria-current={i === index ? 'step' : undefined}
                aria-pressed={i === index}
                onClick={() => dispatch({ type: 'step/set', index: i })}
              >
                {item.id}
              </button>
            </li>
          ))}
        </ol>
        <button type="button" onClick={() => dispatch({ type: 'step/set', index: index + 1 })} disabled={index === last}>
          Next
        </button>
        {inSteps ? (
          <button type="button" onClick={() => dispatch({ type: 'view/set', mode: 'live' })}>
            Exit to live
          </button>
        ) : null}
      </div>

      <div className="stage-lesson">
        <h2 className="caption-title" aria-live="polite">
          <span className="stage-number">{String(step.id).padStart(2, '0')}</span> {step.title}
        </h2>

        <div className="lesson-columns">
          <div className="lesson-main">
            <p className="lesson-purpose">
              <span className="field-label">Why this stage exists</span>
              {step.purpose}
            </p>
            <div>
              <span className="field-label">What happens</span>
              <ol className="lesson-what">
                {step.what.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ol>
            </div>
          </div>

          <div className="lesson-side">
            <p className="lesson-look">
              <span className="field-label">Try this</span>
              {step.look}
            </p>
            <dl className="lesson-terms">
              {step.terms.map(({ term, meaning }) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{meaning}</dd>
                </div>
              ))}
            </dl>
            <p className="caption-question">
              <span className="field-label">Ask the class</span>
              {step.question}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
