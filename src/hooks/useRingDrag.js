import { useRef, useState } from 'react';
import { angleDeltaToMs, normaliseAngleDelta, pointerAngle } from '../lib/ringMath.js';

/**
 * Works out the pointer's angle about the centre of an SVG element.
 *
 * @param {SVGSVGElement} svg The ring.
 * @param {number} clientX Pointer x in viewport pixels.
 * @param {number} clientY Pointer y in viewport pixels.
 * @returns {{ angle: number, distance: number }} The angle and the distance as a fraction of the ring's half-width.
 */
function angleAt(svg, clientX, clientY) {
  const rect = svg.getBoundingClientRect();
  const dx = clientX - (rect.left + rect.width / 2);
  const dy = clientY - (rect.top + rect.height / 2);
  return { angle: pointerAngle(dx, dy), distance: Math.hypot(dx, dy) / (rect.width / 2 || 1) };
}

/**
 * Handles pointer dragging on the clock ring. Each move adds the change in angle,
 * normalised into (-π, π], to the scrubbed time, so the user can wind through
 * as many steps as they like in either direction.
 *
 * @param {import('react').RefObject<SVGSVGElement>} svgRef The ring element.
 * @param {number} period The period X in seconds, so one turn equals one step.
 * @param {(action: object) => void} dispatch The reducer's dispatch function.
 * @returns {{ isDragging: boolean, handlers: Object<string, (event: PointerEvent) => void> }}
 *   Whether a drag is in progress and the pointer handlers to spread on the SVG.
 */
export function useRingDrag(svgRef, period, dispatch) {
  const lastAngle = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Starts a drag when the pointer lands on the ring band, not the centre.
   * @param {PointerEvent} event The pointer event.
   * @returns {void}
   */
  const onPointerDown = (event) => {
    const svg = svgRef.current;
    if (!svg || event.button > 0) {
      return;
    }
    const { angle, distance } = angleAt(svg, event.clientX, event.clientY);
    // Angles near the centre swing wildly with tiny movements, so ignore grabs there.
    if (distance < 0.45) {
      return;
    }
    svg.setPointerCapture(event.pointerId);
    lastAngle.current = angle;
    setIsDragging(true);
    dispatch({ type: 'time/shift', deltaMs: 0, nowMs: Date.now() });
  };

  /**
   * Converts pointer movement into a time change.
   * @param {PointerEvent} event The pointer event.
   * @returns {void}
   */
  const onPointerMove = (event) => {
    const svg = svgRef.current;
    if (!svg || lastAngle.current === null) {
      return;
    }
    const { angle } = angleAt(svg, event.clientX, event.clientY);
    const delta = normaliseAngleDelta(angle - lastAngle.current);
    lastAngle.current = angle;
    if (delta !== 0) {
      dispatch({ type: 'time/shift', deltaMs: angleDeltaToMs(delta, period), nowMs: Date.now() });
    }
  };

  /**
   * Ends the drag.
   * @param {PointerEvent} event The pointer event.
   * @returns {void}
   */
  const onPointerEnd = (event) => {
    if (lastAngle.current === null) {
      return;
    }
    lastAngle.current = null;
    setIsDragging(false);
    svgRef.current?.releasePointerCapture?.(event.pointerId);
  };

  return {
    isDragging,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
    },
  };
}
