import { useState } from 'react';
import { testVectors } from '../content/testVectors.js';
import { decodeBase32 } from '../lib/base32.js';
import { toUtcString } from '../lib/format.js';
import { totpTrace } from '../lib/totp.js';
import { RFC_SECRET } from '../state/reducer.js';
import { useAppState } from '../state/AppContext.jsx';

/**
 * Drawer section listing the six RFC 6238 SHA-1 vectors. Load puts one into the pipeline;
 * Run all computes every vector and marks each as a pass or a fail.
 *
 * @param {{ onLoaded?: () => void }} props Called after a vector is loaded, for example to close the drawer.
 * @returns {JSX.Element} The test vectors panel.
 */
export default function TestVectorsPanel({ onLoaded }) {
  const { dispatch } = useAppState();
  const [results, setResults] = useState(/** @type {Record<number, string>|null} */ (null));
  const [running, setRunning] = useState(false);

  /**
   * Computes every vector with the real library code.
   * @returns {Promise<void>}
   */
  const runAll = async () => {
    setRunning(true);
    const key = decodeBase32(RFC_SECRET).bytes;
    const entries = await Promise.all(
      testVectors.map(async (vector) => {
        try {
          const trace = await totpTrace(key, vector.unixSeconds, { digits: 8, period: 30, t0: 0 });
          return [vector.unixSeconds, trace.code];
        } catch {
          return [vector.unixSeconds, 'error'];
        }
      }),
    );
    setResults(Object.fromEntries(entries));
    setRunning(false);
  };

  const passCount = results ? testVectors.filter((vector) => results[vector.unixSeconds] === vector.expected).length : 0;

  return (
    <section className="drawer-section" aria-labelledby="vectors-title">
      <h2 className="panel-title" id="vectors-title">
        RFC 6238 test vectors
      </h2>
      <p className="hint">SHA-1, 8 digits, X = 30, T0 = 0, secret {RFC_SECRET}.</p>
      <div className="table-scroll">
        <table className="vectors">
          <thead>
            <tr>
              <th scope="col">Unix time</th>
              <th scope="col">UTC</th>
              <th scope="col">T (hex)</th>
              <th scope="col">Expected</th>
              <th scope="col">Actual</th>
              <th scope="col">
                <span className="sr-only">Load</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {testVectors.map((vector) => {
              const actual = results?.[vector.unixSeconds];
              const pass = actual === vector.expected;
              return (
                <tr key={vector.unixSeconds}>
                  <td className="mono">{vector.unixSeconds}</td>
                  <td className="mono">{toUtcString(vector.unixSeconds)}</td>
                  <td className="mono">{vector.tHex}</td>
                  <td className="mono">{vector.expected}</td>
                  <td className={`mono ${actual ? (pass ? 'is-pass' : 'is-fail') : ''}`}>
                    {actual ? (
                      <>
                        <span aria-hidden="true">{pass ? '✓ ' : '✕ '}</span>
                        {actual}
                        <span className="sr-only">{pass ? ', pass' : ', fail'}</span>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => {
                        dispatch({ type: 'vector/load', unixSeconds: vector.unixSeconds });
                        onLoaded?.();
                      }}
                    >
                      Load
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="button-row">
        <button type="button" onClick={runAll} disabled={running}>
          Run all
        </button>
        {results ? (
          <p className={passCount === testVectors.length ? 'pass-note' : 'error-note'} role="status">
            {passCount} of {testVectors.length} passed
          </p>
        ) : null}
      </div>
    </section>
  );
}
