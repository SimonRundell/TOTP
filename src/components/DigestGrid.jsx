import { memo } from 'react';
import { countChangedBytes } from '../lib/bytes.js';
import ByteCell from './ByteCell.jsx';
import PipelinePanel from './PipelinePanel.jsx';

/**
 * Lists the class names for one digest byte.
 *
 * @param {number} index Position in the digest.
 * @param {number} offset Start of the truncation window.
 * @param {boolean} changed Whether the byte differs from the previous digest.
 * @returns {string[]} The ByteCell states.
 */
function cellStates(index, offset, changed) {
  const states = [];
  if (index === 19) states.push('is-offset-source');
  if (index >= offset && index < offset + 4) states.push('in-window');
  if (index === offset) states.push('window-start');
  if (index === offset + 3) states.push('window-end');
  if (changed) states.push('changed');
  return states;
}

/**
 * Stage 03: the 20-byte HMAC-SHA-1 digest, with byte 19's low nibble picked out and
 * an amber bracket sliding along to the four-byte window.
 *
 * @param {{
 *   trace: import('../lib/hotp.js').HotpTrace|null,
 *   previous: import('../lib/hotp.js').HotpTrace|null,
 *   radix: 'hex'|'dec'|'bin',
 *   pending: boolean,
 * }} props The current and previous traces, the radix and whether a newer result is computing.
 * @returns {JSX.Element} The digest panel.
 */
function DigestGrid({ trace, previous, radix, pending }) {
  if (!trace) {
    return (
      <PipelinePanel stage={3} title="HMAC-SHA-1" pending={pending}>
        <p className="hint">Waiting for a valid secret.</p>
      </PipelinePanel>
    );
  }

  const { digest, offset, counter } = trace;
  const changedCount = previous ? countChangedBytes(previous.digest, digest) : null;

  return (
    <PipelinePanel stage={3} title="HMAC-SHA-1" pending={pending}>
      <p className="formula mono">HS = HMAC-SHA-1( key, counter ) = 20 bytes</p>
      <div className={`digest-grid radix-${radix}`} aria-label={`Digest, 20 bytes. Window starts at byte ${offset}.`}>
        {Array.from(digest, (byte, index) => {
          const changed = previous ? previous.digest[index] !== byte : false;
          return (
            <ByteCell
              // A changed byte gets a new key so it remounts and plays its flip once.
              key={changed ? `${index}-${counter}` : index}
              index={index}
              value={byte}
              radix={radix}
              states={cellStates(index, offset, changed)}
              nibble={index === 19}
            />
          );
        })}
        <div className={`window-bracket at-${offset}`} aria-hidden="true" />
      </div>
      <p className="hint" aria-live="polite">
        {changedCount === null
          ? 'Move to another step and watch how many bytes change.'
          : `${changedCount} of 20 bytes changed since the last digest.`}
      </p>
    </PipelinePanel>
  );
}

export default memo(DigestGrid);
