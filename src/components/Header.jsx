import { useAppState } from '../state/AppContext.jsx';

/**
 * A single thin bar: product name, the Live or Step-through toggle, the radix switch
 * and the button that opens the drawer.
 *
 * @param {{ drawerOpen: boolean, onToggleDrawer: () => void }} props Whether the drawer is open and how to toggle it.
 * @returns {JSX.Element} The header.
 */
export default function Header({ drawerOpen, onToggleDrawer }) {
  const { state, dispatch } = useAppState();

  return (
    <header className="topbar">
      <h1 className="brand">
        <img className="brand-logo" src="/favicon.png" alt="" width="28" height="29" />
        TOTP Visualizer
      </h1>
      <div className="topbar-controls">
        <div className="segmented" role="group" aria-label="View">
          <button type="button" aria-pressed={state.viewMode === 'live'} onClick={() => dispatch({ type: 'view/set', mode: 'live' })}>
            Live
          </button>
          <button
            type="button"
            aria-pressed={state.viewMode === 'steps'}
            onClick={() => dispatch({ type: 'view/set', mode: 'steps', nowMs: Date.now() })}
          >
            Step-through
          </button>
        </div>
        <div className="segmented" role="group" aria-label="Byte display">
          {['hex', 'dec', 'bin'].map((radix) => (
            <button key={radix} type="button" aria-pressed={state.radix === radix} onClick={() => dispatch({ type: 'radix/set', value: radix })}>
              {radix.toUpperCase()}
            </button>
          ))}
        </div>
        <button type="button" aria-expanded={drawerOpen} aria-controls="drawer" onClick={onToggleDrawer}>
          Settings
        </button>
      </div>
    </header>
  );
}
