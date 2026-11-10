import { useEffect, useRef } from 'react';
import { useAppState } from '../state/AppContext.jsx';

/**
 * Frame shared by the five pipeline stages. In step-through mode the active stage
 * is lit and the others are dimmed.
 *
 * @param {{ stage: number, title: string, pending?: boolean, children: import('react').ReactNode }} props
 *   The stage number (1 to 5), its title, whether a newer result is still computing, and the content.
 * @returns {JSX.Element} The panel.
 */
export default function PipelinePanel({ stage, title, pending = false, children }) {
  const { state } = useAppState();
  const inSteps = state.viewMode === 'steps';
  const isActive = state.stepIndex === stage - 1;
  const headingId = `stage-${stage}-title`;
  const panelRef = useRef(null);

  // Bring the active stage into view so the teacher never has to scroll on a projector.
  useEffect(() => {
    if (!isActive || !panelRef.current?.scrollIntoView) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    panelRef.current.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [isActive]);

  const classes = ['panel', 'pipeline-panel'];
  if (isActive) classes.push('is-active');
  if (inSteps && !isActive) classes.push('is-dimmed');
  if (pending) classes.push('is-pending');

  return (
    <section ref={panelRef} className={classes.join(' ')} aria-labelledby={headingId} aria-current={isActive ? 'step' : undefined}>
      <h2 className="panel-title" id={headingId}>
        <span className="stage-number">{String(stage).padStart(2, '0')}</span> {title}
      </h2>
      {children}
    </section>
  );
}
