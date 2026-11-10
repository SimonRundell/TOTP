import { createContext, useContext } from 'react';

/**
 * Holds `{ state, dispatch }` from the reducer in App.jsx.
 * @type {import('react').Context<{ state: import('./reducer.js').AppState, dispatch: (action: object) => void } | null>}
 */
export const AppContext = createContext(null);

/**
 * Reads the app state and dispatch function.
 *
 * @returns {{ state: import('./reducer.js').AppState, dispatch: (action: object) => void }} The shared state.
 */
export function useAppState() {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error('useAppState must be used inside AppContext.');
  }
  return value;
}
