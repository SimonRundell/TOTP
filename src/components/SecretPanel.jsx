import { memo, useId, useState } from 'react';
import { BASE32_ALPHABET, encodeBase32 } from '../lib/base32.js';
import { formatByte, textToBytes } from '../lib/bytes.js';
import { RFC_SECRET } from '../state/reducer.js';
import { useAppState } from '../state/AppContext.jsx';
import ByteCell from './ByteCell.jsx';
import PipelinePanel from './PipelinePanel.jsx';

/**
 * Explains why the secret cannot be used.
 *
 * @param {string} input The raw secret text.
 * @param {number[]} invalidAt Zero-based indexes of illegal characters.
 * @returns {string} A plain-language message.
 */
function invalidMessage(input, invalidAt) {
  if (input.trim() === '') {
    return 'Type a secret to start. An empty key cannot be used.';
  }
  if (invalidAt.length === 0) {
    return 'That is too short. It takes at least two Base32 characters to make one byte.';
  }
  const positions = invalidAt.map((index) => index + 1);
  if (positions.length === 1) {
    return `Base32 uses A to Z and 2 to 7. The character at position ${positions[0]} is not valid.`;
  }
  const list = `${positions.slice(0, -1).join(', ')} and ${positions.at(-1)}`;
  return `Base32 uses A to Z and 2 to 7. The characters at positions ${list} are not valid.`;
}

/**
 * Echoes the typed secret with each illegal character underlined in red.
 *
 * @param {{ input: string, invalidAt: number[] }} props The raw text and the bad positions.
 * @returns {JSX.Element} The marked-up echo.
 */
function InvalidEcho({ input, invalidAt }) {
  const bad = new Set(invalidAt);
  return (
    <p className="secret-echo" aria-hidden="true">
      {Array.from(input, (character, index) =>
        bad.has(index) ? (
          <mark key={index} className="bad-char">
            {character}
          </mark>
        ) : (
          <span key={index}>{character}</span>
        ),
      )}
    </p>
  );
}

/**
 * Shows how each Base32 character becomes five bits and how those bits regroup into bytes.
 *
 * @param {{ normalised: string, discardedBits: number, radix: 'hex'|'dec'|'bin' }} props
 *   The cleaned secret, the count of leftover bits and the radix for byte values.
 * @returns {JSX.Element} The explainer strip.
 */
function Base32Explainer({ normalised, discardedBits, radix }) {
  const chars = Array.from(normalised).filter((character) => BASE32_ALPHABET.includes(character));
  const bits = chars.map((character) => BASE32_ALPHABET.indexOf(character).toString(2).padStart(5, '0')).join('');
  const usable = bits.length - discardedBits;
  const groups = [];
  for (let i = 0; i < usable; i += 8) {
    groups.push(bits.slice(i, i + 8));
  }

  return (
    <details className="explainer">
      <summary>How Base32 works</summary>
      <p className="explainer-note">Each character stands for a 5-bit value. The bits are joined up, then cut into 8-bit bytes.</p>
      <div className="b32-chars">
        {chars.map((character, index) => (
          <span key={index} className="b32-char">
            <span className="b32-letter">{character}</span>
            <span className="b32-bits">{bits.slice(index * 5, index * 5 + 5)}</span>
          </span>
        ))}
      </div>
      <div className="b32-bytes">
        {groups.map((group, index) => (
          <span key={index} className="b32-byte">
            <span className="b32-bits">{group}</span>
            <span className="b32-value">{formatByte(parseInt(group, 2), radix)}</span>
          </span>
        ))}
        {discardedBits > 0 ? (
          <span className="b32-byte is-discarded">
            <span className="b32-bits">{bits.slice(usable)}</span>
            <span className="b32-value">thrown away</span>
          </span>
        ) : null}
      </div>
    </details>
  );
}

/**
 * Stage 01: the Base32 secret, its decoded bytes and the tools for making one.
 *
 * @param {{ secret: import('../lib/base32.js').Base32Result, radix: 'hex'|'dec'|'bin' }} props
 *   The decoded secret and the radix for byte display.
 * @returns {JSX.Element} The secret panel.
 */
function SecretPanel({ secret, radix }) {
  const { state, dispatch } = useAppState();
  const [showTextField, setShowTextField] = useState(false);
  const [plainText, setPlainText] = useState('');
  const inputId = useId();
  const errorId = useId();

  /** Generates 20 random bytes and loads them as Base32. */
  const loadRandom = () => {
    const bytes = new Uint8Array(20);
    crypto.getRandomValues(bytes);
    dispatch({ type: 'secret/set', value: encodeBase32(bytes) });
  };

  /**
   * Converts the typed text to Base32 and loads it.
   * @param {SubmitEvent} event The form submission.
   * @returns {void}
   */
  const convertText = (event) => {
    event.preventDefault();
    if (plainText !== '') {
      dispatch({ type: 'secret/set', value: encodeBase32(textToBytes(plainText)) });
    }
  };

  return (
    <PipelinePanel stage={1} title="Secret">
      <div className="secret-row">
        <label htmlFor={inputId} className="field-label">
          Base32 secret
        </label>
        <input
          id={inputId}
          className={`secret-input mono ${secret.ok ? '' : 'is-invalid'}`}
          value={state.secretInput}
          onChange={(event) => dispatch({ type: 'secret/set', value: event.target.value })}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={!secret.ok}
          aria-describedby={secret.ok ? undefined : errorId}
        />
        <div className="button-row">
          <button type="button" onClick={loadRandom}>
            Random
          </button>
          <button type="button" onClick={() => dispatch({ type: 'secret/set', value: RFC_SECRET })}>
            RFC secret
          </button>
          <button type="button" aria-expanded={showTextField} onClick={() => setShowTextField((open) => !open)}>
            From text
          </button>
        </div>
      </div>

      {showTextField ? (
        <form className="text-convert" onSubmit={convertText}>
          <label>
            <span className="field-label">Text to turn into a secret</span>
            <input value={plainText} onChange={(event) => setPlainText(event.target.value)} placeholder="12345678901234567890" />
          </label>
          <button type="submit">Convert</button>
        </form>
      ) : null}

      {secret.ok ? (
        <>
          <div className="byte-row" aria-label={`Decoded key, ${secret.bytes.length} bytes`}>
            {Array.from(secret.bytes, (byte, index) => (
              <ByteCell key={index} index={index} value={byte} radix={radix} />
            ))}
          </div>
          <Base32Explainer normalised={secret.normalised} discardedBits={secret.discardedBits} radix={radix} />
        </>
      ) : (
        <>
          {secret.invalidAt.length > 0 ? <InvalidEcho input={state.secretInput} invalidAt={secret.invalidAt} /> : null}
          <p className="error-note" id={errorId} role="alert">
            <span aria-hidden="true">✕ </span>
            {invalidMessage(state.secretInput, secret.invalidAt)}
          </p>
        </>
      )}

      <p className="warning-line">Use made-up secrets only. Never paste a real account secret into a website, including this one.</p>
    </PipelinePanel>
  );
}

export default memo(SecretPanel);
