import { memo } from 'react';
import { formatByte, nibbleBits } from '../lib/bytes.js';
import ByteCell from './ByteCell.jsx';
import PipelinePanel from './PipelinePanel.jsx';

/**
 * Shows a byte in binary with the top bit marked when it has been cleared.
 *
 * @param {{ value: number, clearedTop?: boolean }} props The byte and whether its top bit was just cleared.
 * @returns {JSX.Element} The bits, grouped in fours.
 */
function Bits({ value, clearedTop = false }) {
  const [high, low] = nibbleBits(value);
  return (
    <span className="bits mono">
      {clearedTop ? <span className="bit-cleared">{high[0]}</span> : high[0]}
      {high.slice(1)} {low}
    </span>
  );
}

/**
 * Stage 04: dynamic truncation as four short operations with live values.
 *
 * @param {{ trace: import('../lib/hotp.js').HotpTrace|null, radix: 'hex'|'dec'|'bin', pending: boolean }} props
 *   The current trace, the radix for the window bytes and whether a newer result is computing.
 * @returns {JSX.Element} The truncation panel.
 */
function TruncationPanel({ trace, radix, pending }) {
  if (!trace) {
    return (
      <PipelinePanel stage={4} title="Truncate" pending={pending}>
        <p className="hint">Waiting for a valid secret.</p>
      </PipelinePanel>
    );
  }

  const { lastByte, offset, windowBytes, maskedFirstByte, maskChangedByte, binaryCode } = trace;
  /** Formats a byte as two hex digits. */
  const hex = (value) => formatByte(value, 'hex');
  const maskedHex = `0x${hex(maskedFirstByte)}${Array.from(windowBytes.slice(1), hex).join('')}`;
  const [, lowNibble] = nibbleBits(lastByte);

  return (
    <PipelinePanel stage={4} title="Truncate" pending={pending}>
      <ol className="truncation-steps">
        <li>
          <h3>Find the offset</h3>
          <p className="mono">
            HS[19] = 0x{hex(lastByte)} = {nibbleBits(lastByte)[0]} <span className="nibble">{lowNibble}</span>, low nibble 0x
            <span className="nibble">{(lastByte & 0x0f).toString(16).toUpperCase()}</span>, so offset is{' '}
            <strong className="amber">{offset}</strong>
          </p>
        </li>
        <li>
          <h3>Take four bytes</h3>
          <div className="byte-row is-bracketed" aria-label={`Bytes ${offset} to ${offset + 3}`}>
            {Array.from(windowBytes, (byte, index) => (
              <ByteCell
                key={index}
                index={offset + index}
                value={byte}
                radix={radix}
                states={['in-window', index === 0 ? 'window-start' : '', index === 3 ? 'window-end' : ''].filter(Boolean)}
              />
            ))}
          </div>
        </li>
        <li>
          <h3>Mask the top bit</h3>
          {maskChangedByte ? (
            <p className="mono mask-line">
              <Bits value={windowBytes[0]} clearedTop /> <span aria-hidden="true">→</span>
              <span className="sr-only">becomes</span> <Bits value={maskedFirstByte} />
              <span className="hint"> The top bit, shown in red and struck through, is cleared.</span>
            </p>
          ) : (
            <p className="mono mask-line">
              <Bits value={windowBytes[0]} /> <span className="hint">Top bit already 0, nothing to change.</span>
            </p>
          )}
        </li>
        <li>
          <h3>Read as one number</h3>
          <p className="mono">
            {maskedHex} = <strong className="amber">{binaryCode}</strong>
          </p>
        </li>
      </ol>
    </PipelinePanel>
  );
}

export default memo(TruncationPanel);
