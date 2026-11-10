// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import App from '../../App.jsx';

/**
 * Reads the step number out of the ring's aria-valuetext.
 *
 * @param {HTMLElement} ring The slider.
 * @returns {number} The counter T.
 */
function counterOf(ring) {
  return Number(/step (\d+)/.exec(ring.getAttribute('aria-valuetext'))[1]);
}

test('Shift + Right advances the counter by exactly one', () => {
  render(<App />);
  const ring = screen.getByRole('slider');
  // Scrub first so the real clock cannot tick over between reading and pressing.
  fireEvent.keyDown(ring, { key: 'ArrowRight' });
  const before = counterOf(ring);
  fireEvent.keyDown(ring, { key: 'ArrowRight', shiftKey: true });
  expect(counterOf(ring)).toBe(before + 1);
  fireEvent.keyDown(ring, { key: 'ArrowLeft', shiftKey: true });
  expect(counterOf(ring)).toBe(before);
});
