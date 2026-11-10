/**
 * Angle maths for the clock ring. One full turn equals one period.
 * Angles are in radians, measured clockwise from 12 o'clock.
 */

const TAU = Math.PI * 2;

/**
 * Normalises an angular change into the range (-π, π] so crossing 12 o'clock never causes a jump.
 *
 * @param {number} delta The raw change in radians.
 * @returns {number} The equivalent change in (-π, π].
 * @example
 * normaliseAngleDelta(1.5 * Math.PI) // -0.5 * Math.PI
 */
export function normaliseAngleDelta(delta) {
  const wrapped = ((((delta + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
  return wrapped <= -Math.PI ? wrapped + TAU : wrapped;
}

/**
 * Finds the angle of a point about the ring centre, clockwise from 12 o'clock.
 *
 * @param {number} dx Horizontal distance from the centre (right is positive).
 * @param {number} dy Vertical distance from the centre (down is positive, as on screen).
 * @returns {number} An angle in [0, 2π).
 * @example
 * pointerAngle(1, 0) // Math.PI / 2 (3 o'clock)
 */
export function pointerAngle(dx, dy) {
  const angle = Math.atan2(dx, -dy);
  return angle < 0 ? angle + TAU : angle;
}

/**
 * Converts a change in angle into a change in time.
 *
 * @param {number} delta The change in radians.
 * @param {number} period The period X in seconds.
 * @returns {number} The change in milliseconds.
 * @example
 * angleDeltaToMs(Math.PI, 30) // 15000
 */
export function angleDeltaToMs(delta, period) {
  return (delta / TAU) * period * 1000;
}

/**
 * Works out how far through the current step a moment is, as a fraction.
 *
 * @param {number} unixMs The moment in milliseconds.
 * @param {number} period The period X in seconds.
 * @param {number} t0 The epoch offset T0 in seconds.
 * @returns {number} A fraction in [0, 1).
 * @example
 * stepFraction(45000, 30, 0) // 0.5
 */
export function stepFraction(unixMs, period, t0) {
  const seconds = unixMs / 1000 - t0;
  const into = ((seconds % period) + period) % period;
  return into / period;
}

/**
 * Converts an angle and radius to a point, for drawing on the SVG.
 *
 * @param {number} cx Centre x.
 * @param {number} cy Centre y.
 * @param {number} radius Distance from the centre.
 * @param {number} angle Radians clockwise from 12 o'clock.
 * @returns {{ x: number, y: number }} The point in SVG coordinates.
 * @example
 * polarPoint(100, 100, 50, 0) // { x: 100, y: 50 }
 */
export function polarPoint(cx, cy, radius, angle) {
  return {
    x: cx + radius * Math.sin(angle),
    y: cy - radius * Math.cos(angle),
  };
}
