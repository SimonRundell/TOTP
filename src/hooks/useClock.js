import { useEffect, useState } from 'react';

/**
 * Returns the effective time. In live mode a requestAnimationFrame loop reads Date.now()
 * every frame so the ring moves smoothly. In scrubbed mode it returns the scrubbed time
 * and only refreshes the real time once a second, so the "scrubbed by" offset stays true.
 *
 * @param {'live'|'scrubbed'} timeMode Whether the clock follows real time.
 * @param {number|null} scrubTimeMs The chosen time when scrubbed.
 * @returns {{ timeMs: number, realMs: number }} The effective time and the latest real time read.
 */
export function useClock(timeMode, scrubTimeMs) {
  const [realMs, setRealMs] = useState(() => Date.now());

  useEffect(() => {
    if (timeMode !== 'live') {
      const intervalId = setInterval(() => setRealMs(Date.now()), 1000);
      return () => clearInterval(intervalId);
    }

    let frameId = 0;
    /** Reads the clock and schedules the next frame. */
    const tick = () => {
      setRealMs(Date.now());
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [timeMode]);

  return {
    timeMs: timeMode === 'live' || scrubTimeMs === null ? realMs : scrubTimeMs,
    realMs,
  };
}
