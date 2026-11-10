import { memo } from 'react';
import { counterToBytes } from '../lib/bytes.js';
import ByteCell from './ByteCell.jsx';
import PipelinePanel from './PipelinePanel.jsx';
import TimeReadout from './TimeReadout.jsx';

/**
 * Stage 02: the sum that turns time into the counter T, and T as eight big-endian bytes.
 *
 * @param {{ unixSeconds: number, period: number, t0: number, counter: number, radix: 'hex'|'dec'|'bin' }} props
 *   The time, period X, T0, the resulting counter and the radix for byte display.
 * @returns {JSX.Element} The counter panel.
 */
function CounterPanel({ unixSeconds, period, t0, counter, radix }) {
  const bytes = counterToBytes(counter);
  const firstUsed = bytes.findIndex((byte) => byte !== 0);
  const leadingZeros = firstUsed === -1 ? 8 : firstUsed;

  return (
    <PipelinePanel stage={2} title="Time">
      <div className="counter-layout">
        <TimeReadout unixSeconds={unixSeconds} />
        <div className="formula mono">
          <p>T = floor( (unix time − T0) ÷ X )</p>
          <p>
            T = floor( ({unixSeconds} − {t0}) ÷ {period} ) = <strong className="formula-result">{counter}</strong>
          </p>
        </div>
      </div>
      <div className="byte-row" aria-label="Counter as 8 bytes, big-endian">
        {Array.from(bytes, (byte, index) => (
          <ByteCell key={index} index={index} value={byte} radix={radix} states={index < leadingZeros ? ['dim'] : []} />
        ))}
      </div>
      <p className="hint">
        {leadingZeros} of the 8 counter bytes are still zero. The field is big enough to count for billions of years.
      </p>
    </PipelinePanel>
  );
}

export default memo(CounterPanel);
