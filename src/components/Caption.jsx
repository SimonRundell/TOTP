/**
 * The caption for the active stage in step-through mode, with a question for the class.
 *
 * @param {{ step: { id: number, title: string, body: string, question: string } }} props The caption content.
 * @returns {JSX.Element} The caption.
 */
export default function Caption({ step }) {
  return (
    <div className="caption" aria-live="polite">
      <h2 className="caption-title">
        <span className="stage-number">{String(step.id).padStart(2, '0')}</span> {step.title}
      </h2>
      <p>{step.body}</p>
      <p className="caption-question">
        <span className="field-label">Ask the class</span> {step.question}
      </p>
    </div>
  );
}
