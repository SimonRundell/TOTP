import { QRCodeSVG } from 'qrcode.react';
import { useId, useState } from 'react';
import { buildOtpauthUri } from '../lib/otpauth.js';
import { buildShareHash } from '../lib/shareLink.js';
import { useAppState } from '../state/AppContext.jsx';

/**
 * Copies text to the clipboard.
 *
 * @param {string} text The text to copy.
 * @returns {Promise<boolean>} True when the copy worked.
 */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Drawer section with the otpauth:// URI, a QR code for phones, and a shareable link.
 *
 * @param {{ secret: import('../lib/base32.js').Base32Result }} props The decoded secret.
 * @returns {JSX.Element} The QR panel.
 */
export default function QrPanel({ secret }) {
  const { state, dispatch } = useAppState();
  const [copied, setCopied] = useState('');
  const issuerId = useId();
  const accountId = useId();
  const uriId = useId();

  const uri = buildOtpauthUri(state.issuer, state.account, secret.normalised, {
    digits: state.digits,
    period: state.period,
  });

  /**
   * Copies the URI and reports the outcome.
   * @returns {Promise<void>}
   */
  const copyUri = async () => {
    setCopied((await copyText(uri)) ? 'uri' : 'failed');
  };

  /**
   * Writes the settings into the URL fragment, which browsers never send to the server, then copies the link.
   * @returns {Promise<void>}
   */
  const copyLink = async () => {
    const hash = buildShareHash(state);
    window.history.replaceState(null, '', `#${hash}`);
    setCopied((await copyText(window.location.href)) ? 'link' : 'failed');
  };

  return (
    <section className="drawer-section" aria-labelledby="qr-title">
      <h2 className="panel-title" id="qr-title">
        QR code and otpauth URI
      </h2>

      <div className="field">
        <label htmlFor={issuerId} className="field-label">
          Issuer
        </label>
        <input id={issuerId} value={state.issuer} onChange={(event) => dispatch({ type: 'qr/issuer', value: event.target.value })} />
      </div>
      <div className="field">
        <label htmlFor={accountId} className="field-label">
          Account name
        </label>
        <input id={accountId} value={state.account} onChange={(event) => dispatch({ type: 'qr/account', value: event.target.value })} />
      </div>

      {secret.ok ? (
        <>
          <div className="field">
            <label htmlFor={uriId} className="field-label">
              otpauth:// URI
            </label>
            <div className="copy-row">
              <input id={uriId} className="mono" readOnly value={uri} onFocus={(event) => event.target.select()} />
              <button type="button" onClick={copyUri}>
                Copy
              </button>
            </div>
          </div>
          <div className="qr-frame">
            <QRCodeSVG value={uri} size={232} level="M" marginSize={4} bgColor="#ffffff" fgColor="#000000" title="QR code for the otpauth URI" />
          </div>
          <p className="hint">Scan this with an authenticator app, then press Return to live. The code on your phone should match the code on the ring.</p>
          {state.t0 !== 0 ? (
            <p className="warning-line">The otpauth URI has no way to say T0, so a phone will count from 0 and will not match.</p>
          ) : null}
          {state.timeMode === 'scrubbed' ? (
            <p className="warning-line">The clock is scrubbed. A phone always uses the real time, so it will not match until you return to live.</p>
          ) : null}
        </>
      ) : (
        <p className="error-note">Fix the secret first. There is nothing to put in a QR code yet.</p>
      )}

      <h3 className="sub-title">Share with a class</h3>
      <div className="button-row">
        <button type="button" onClick={copyLink}>
          Copy link
        </button>
        <p className="warning-line">The link contains the secret. Only share made-up ones.</p>
      </div>

      <p className="hint" role="status">
        {copied === 'uri' ? 'URI copied.' : null}
        {copied === 'link' ? 'Link copied. It is also in the address bar.' : null}
        {copied === 'failed' ? 'Could not copy. Select the text and copy it yourself.' : null}
      </p>
    </section>
  );
}
