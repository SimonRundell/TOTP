// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { decodeBase32 } from '../../lib/base32.js';
import { useAppState } from '../../state/AppContext.jsx';
import SecretPanel from '../SecretPanel.jsx';
import { renderWithState } from './renderWithState.jsx';

/**
 * Feeds the panel a secret decoded from live state, as App does.
 *
 * @returns {JSX.Element} The secret panel.
 */
function ConnectedSecretPanel() {
  const { state } = useAppState();
  return <SecretPanel secret={decodeBase32(state.secretInput)} radix="hex" />;
}

test('An invalid character produces the error message', () => {
  renderWithState(<ConnectedSecretPanel />);
  fireEvent.change(screen.getByLabelText('Base32 secret'), { target: { value: 'JBSWY3DP0' } });
  expect(screen.getByRole('alert').textContent).toContain(
    'Base32 uses A to Z and 2 to 7. The character at position 9 is not valid.',
  );
});
