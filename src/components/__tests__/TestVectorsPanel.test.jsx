// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import TestVectorsPanel from '../TestVectorsPanel.jsx';
import { renderWithState } from './renderWithState.jsx';

test('Run all shows six passes', async () => {
  renderWithState(<TestVectorsPanel />);
  fireEvent.click(screen.getByRole('button', { name: 'Run all' }));
  expect(await screen.findByText('6 of 6 passed')).toBeTruthy();
  expect(screen.getAllByText(/, pass$/)).toHaveLength(6);
});
