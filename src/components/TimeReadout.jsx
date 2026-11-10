import { memo } from 'react';
import { toLocalString, toUtcString } from '../lib/format.js';

/**
 * Shows one moment three ways: Unix seconds, UTC and local time.
 *
 * @param {{ unixSeconds: number }} props The moment in whole Unix seconds.
 * @returns {JSX.Element} The readout.
 */
function TimeReadout({ unixSeconds }) {
  return (
    <dl className="time-readout">
      <div>
        <dt>Unix seconds</dt>
        <dd className="mono">{unixSeconds}</dd>
      </div>
      <div>
        <dt>UTC</dt>
        <dd className="mono">{toUtcString(unixSeconds)}</dd>
      </div>
      <div>
        <dt>Local time</dt>
        <dd className="mono">{toLocalString(unixSeconds)}</dd>
      </div>
    </dl>
  );
}

export default memo(TimeReadout);
