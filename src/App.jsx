import { useCallback, useEffect, useEffectEvent, useMemo, useReducer, useRef, useState } from 'react';
import ClockRing from './components/ClockRing.jsx';
import CMFloatAd from './components/CMFloatAd.jsx';
import CodeDisplay from './components/CodeDisplay.jsx';
import CounterPanel from './components/CounterPanel.jsx';
import DigestGrid from './components/DigestGrid.jsx';
import Header from './components/Header.jsx';
import QrPanel from './components/QrPanel.jsx';
import SecretPanel from './components/SecretPanel.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import TeachingCard from './components/TeachingCard.jsx';
import TestVectorsPanel from './components/TestVectorsPanel.jsx';
import TruncationPanel from './components/TruncationPanel.jsx';
import VerificationWindow from './components/VerificationWindow.jsx';
import { useClock } from './hooks/useClock.js';
import { useTotpTrace } from './hooks/useTotpTrace.js';
import { decodeBase32 } from './lib/base32.js';
import { timeToCounter } from './lib/totp.js';
import { AppContext } from './state/AppContext.jsx';
import { createInitialState, reducer } from './state/reducer.js';

/**
 * Reads the URL fragment once at start-up so a shared link restores its settings.
 *
 * @returns {import('./state/reducer.js').AppState} The initial state.
 */
function initState() {
  return createInitialState(typeof window === 'undefined' ? '' : window.location.hash);
}

/**
 * The slide-over drawer holding settings, test vectors and the QR code. It slides in
 * from the right so the pipeline is never hidden behind a modal.
 *
 * @param {{ open: boolean, onClose: () => void, timeMs: number, secret: import('./lib/base32.js').Base32Result }} props
 *   Whether it is open, how to close it, the effective time and the decoded secret.
 * @returns {JSX.Element} The drawer.
 */
function Drawer({ open, onClose, timeMs, secret }) {
  /**
   * Closes the drawer on Escape.
   * @param {KeyboardEvent} event The key press.
   * @returns {void}
   */
  const onKey = useEffectEvent((event) => {
    if (event.key === 'Escape') onClose();
  });

  const closeRef = useRef(null);

  // Move focus into the drawer when it opens and hand it back to whatever opened it on close.
  // The drawer is inert while closed, so focus cannot be left inside it.
  useEffect(() => {
    if (!open) return undefined;
    const opener = document.activeElement;
    closeRef.current?.focus();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [open]);

  return (
    <>
      {/* Clicking anywhere outside the open drawer closes it. Escape does the same for keyboards. */}
      {open ? <div className="drawer-backdrop" aria-hidden="true" onClick={onClose} /> : null}
      <aside id="drawer" className={`drawer ${open ? 'is-open' : ''}`} aria-label="Settings and tools" inert={!open}>
      <div className="drawer-head">
        <span className="panel-title">Settings and tools</span>
        <button type="button" ref={closeRef} onClick={onClose}>
          Close
        </button>
      </div>
      <SettingsPanel timeMs={timeMs} />
      <TestVectorsPanel onLoaded={onClose} />
      <QrPanel secret={secret} />
      </aside>
    </>
  );
}

/**
 * The main visualizer. Owns the single reducer and derives everything else from it.
 *
 * @returns {JSX.Element} The whole interface.
 */
function Visualizer() {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const contextValue = useMemo(() => ({ state, dispatch }), [state]);

  const { timeMs, realMs } = useClock(state.timeMode, state.scrubTimeMs);
  const secret = useMemo(() => decodeBase32(state.secretInput), [state.secretInput]);
  const key = secret.ok ? secret.bytes : null;

  const unixSeconds = Math.floor(timeMs / 1000);
  const step = timeToCounter(unixSeconds, state.period, state.t0);
  const traces = useTotpTrace(key, step.counter, state.digits);
  const { current, pending } = traces;
  const shownCode = current && !pending ? current.code : null;

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <AppContext.Provider value={contextValue}>
      <div className={`app view-${state.viewMode}`}>
        <Header drawerOpen={drawerOpen} onToggleDrawer={() => setDrawerOpen((open) => !open)} />

        {traces.error ? (
          <p className="error-note" role="alert">
            Something went wrong with the HMAC step: {traces.error}
          </p>
        ) : null}

        <main className="layout">
          <div className="ring-column">
            <ClockRing timeMs={timeMs} realMs={realMs} step={step} code={shownCode} announcedCode={current?.code ?? null} />
          </div>

          <TeachingCard />

          <div className="pipeline">
            <SecretPanel secret={secret} radix={state.radix} />
            <CounterPanel unixSeconds={unixSeconds} period={state.period} t0={state.t0} counter={step.counter} radix={state.radix} />
            <DigestGrid trace={current} previous={traces.previous} radix={state.radix} pending={pending} />
            <TruncationPanel trace={current} radix={state.radix} pending={pending} />
            <CodeDisplay trace={current} pending={pending} />
          </div>

          <div className="verification-row">
            <VerificationWindow entries={traces.window} pending={pending} />
          </div>
        </main>

        <footer className="footer">
          <span>
            TOTP Visualizer by Simon Rundell, licensed under{' '}
            <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noreferrer">
              CC BY-NC-SA 4.0
            </a>
            .
          </span>
          <span>Everything runs in your browser. Nothing is sent or stored.</span>
        </footer>

        <Drawer open={drawerOpen} onClose={closeDrawer} timeMs={timeMs} secret={secret} />
        <CMFloatAd bgColor="#0d1726" color="#d7ecf5" />
      </div>
    </AppContext.Provider>
  );
}

/**
 * Entry component. Web Crypto only exists on HTTPS or localhost, so check for it first
 * and explain the problem instead of showing a blank screen.
 *
 * @returns {JSX.Element} The app, or a message when Web Crypto is missing.
 */
export default function App() {
  if (!globalThis.crypto?.subtle) {
    return (
      <main className="secure-notice">
        <h1 className="brand">TOTP Visualizer</h1>
        <p>This page needs a secure connection.</p>
        <p>
          The HMAC maths runs through the browser&apos;s Web Crypto API, which only works on HTTPS or on localhost. Open the
          site with https:// at the start of the address and try again.
        </p>
      </main>
    );
  }
  return <Visualizer />;
}
