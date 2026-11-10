import { memo } from 'react';
import { formatByte } from '../lib/bytes.js';

/**
 * Renders the byte's text, picking out the low nibble in amber when asked.
 *
 * @param {{ value: number, radix: 'hex'|'dec'|'bin', nibble: boolean }} props The byte, the radix and whether to mark the low nibble.
 * @returns {JSX.Element} The value text.
 */
function ByteValue({ value, radix, nibble }) {
  const text = formatByte(value, radix);
  if (!nibble || radix === 'dec') {
    return <span className="byte-value">{text}</span>;
  }
  const split = radix === 'hex' ? 1 : 4;
  return (
    <span className="byte-value">
      {text.slice(0, split)}
      <span className="nibble">{text.slice(split)}</span>
    </span>
  );
}

/**
 * The basic unit of the display: one byte in the current radix with its index above.
 * States are class names: default, dim, is-offset-source, in-window, window-start,
 * window-end, is-masked and changed.
 *
 * @param {{ index: number, value: number, radix: 'hex'|'dec'|'bin', states?: string[], nibble?: boolean }} props
 *   The byte's position and value, the radix, its states, and whether to highlight the low nibble.
 * @returns {JSX.Element} The byte cell.
 */
function ByteCell({ index, value, radix, states = [], nibble = false }) {
  const stateClasses = states.length > 0 ? states.join(' ') : 'default';
  return (
    <div className={`byte-cell ${stateClasses}`}>
      <span className="byte-index">{index}</span>
      <ByteValue value={value} radix={radix} nibble={nibble} />
    </div>
  );
}

export default memo(ByteCell);
