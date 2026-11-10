/* eslint-disable react/only-export-components -- test helper, never hot-reloaded */
import { render } from '@testing-library/react';
import { useMemo, useReducer } from 'react';
import { AppContext } from '../../state/AppContext.jsx';
import { createInitialState, reducer } from '../../state/reducer.js';

/**
 * Provides the real reducer to a component under test.
 *
 * @param {{ children: import('react').ReactNode, overrides?: object }} props The tree and any state overrides.
 * @returns {JSX.Element} The provider.
 */
function TestProvider({ children, overrides }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({ ...createInitialState(''), ...overrides }));
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Renders a component inside the app's state provider.
 *
 * @param {JSX.Element} ui The component to render.
 * @param {object} [overrides] Initial state values to change.
 * @returns {import('@testing-library/react').RenderResult} The render result.
 */
export function renderWithState(ui, overrides = {}) {
  return render(<TestProvider overrides={overrides}>{ui}</TestProvider>);
}
