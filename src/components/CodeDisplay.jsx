import { memo } from 'react';
import { groupCode } from '../lib/format.js';
import PipelinePanel from './PipelinePanel.jsx';

/**
 * Stage 05: the reduction mod 10^digits. The kept digits are amber and the rest dimmed,
 * so "mod 10^6" reads as "keep the last six digits".
 *
 * @param {{ trace: import('../lib/hotp.js').HotpTrace|null, pending: boolean }} props
 *   The current trace and whether a newer result is computing.
 * @returns {JSX.Element} The code panel.
 */
function CodeDisplay({ trace, pending }) {
  if (!trace) {
    return (
      <PipelinePanel stage={5} title="Code" pending={pending}>
        <p className="hint">Waiting for a valid secret.</p>
      </PipelinePanel>
    );
  }

  const { binaryCode, modulus, digits, code } = trace;
  const full = String(binaryCode);
  const keepFrom = Math.max(0, full.length - digits);
  const reduced = String(binaryCode % modulus);
  const padded = reduced.length < digits;

  return (
    <PipelinePanel stage={5} title="Code" pending={pending}>
      <p className="formula mono">
        {binaryCode} mod {modulus} = {reduced}
      </p>
      <p className="mod-digits mono" aria-label={`${full}, keep the last ${digits} digits`}>
        <span className="dropped">{full.slice(0, keepFrom)}</span>
        <span className="kept">{full.slice(keepFrom)}</span>
      </p>
      {padded ? (
        <p className="hint">
          Result was {reduced}, padded to {code}.
        </p>
      ) : null}
      <p className="final-code mono">{groupCode(code)}</p>
    </PipelinePanel>
  );
}

export default memo(CodeDisplay);
