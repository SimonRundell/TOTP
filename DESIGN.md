# DESIGN.md: TOTP Visualizer

An interactive 2D visualizer for Time-based One-Time Passwords (RFC 6238).

| | |
|---|---|
| Working name | TOTP Visualizer (`totp-visualizer`) |
| Author | Simon Rundell |
| Stack | Vite + React + JavaScript, client-only |
| Licence | Creative Commons BY-NC-SA 4.0 International |
| Audience | 16-19 Further Education students (NCFE Level 2, BTEC Level 3, T Level) and their teachers |
| Status | Design brief for a Claude Code agent. Nothing has been built yet. |

---

## 1. Purpose

Students use authenticator apps every day and have no idea what is going on inside them. This tool opens the box. The user types or generates a Base32 secret, and the app shows every stage of the real algorithm: the secret decoded to bytes, the clock turned into a counter, a real HMAC-SHA-1 digest, the dynamic truncation that picks four bytes out of twenty, and the final 6, 7 or 8 digit code.

The centrepiece is a clock ring. It runs live against the system clock, and the user can grab it and drag to scrub backwards and forwards through time. Every time the ring crosses a step boundary the digest changes completely and the truncation window jumps to a new position.

Nothing is faked. Codes produced by the app must match a real authenticator app given the same secret, and must match the published RFC test vectors.

### Success criteria

1. With default settings (6 digits, 30 seconds, T0 = 0) the live code matches Google Authenticator, Microsoft Authenticator or Aegis for the same secret.
2. All six RFC 6238 Appendix B SHA-1 vectors pass, both in the unit tests and in the in-app test vector panel.
3. A teacher can project it at 1920x1080 and walk a class through the algorithm stage by stage without touching the code.
4. Dragging the ring feels smooth and never shows a stale or mismatched code.

### Out of scope

- No backend. No PHP, no MySQL, no Axios, no `/api` folder.
- No SHA-256 or SHA-512. SHA-1 only.
- No user accounts, no storage of secrets beyond the current browser session.
- No React Router. This is a single view.

---

## 2. Decisions already made

These were settled with the author before this brief was written. Do not revisit them.

| Topic | Decision |
|---|---|
| Architecture | Client-only. All cryptography runs in the browser through the Web Crypto API. |
| Hash | HMAC-SHA-1 only. |
| Interaction | Two modes: a Live view and a guided Step-through view. |
| Extras | QR code and `otpauth://` URI, RFC test vectors, adjustable period and T0, verification window. |
| Style | Modern and professional, dark theme, Tron-style glowing highlights. |

---

## 3. Conventions the agent must follow

1. Scaffold with `npm create vite@latest` using the React + JavaScript template and keep that folder structure. React code lives in the project root.
2. JavaScript only. No TypeScript.
3. One CSS file: `src/index.css`. Delete `src/App.css` from the template. No CSS modules, no CSS-in-JS, no Tailwind.
4. No inline styles. Drive dynamic geometry through SVG attributes (`transform`, `d`, `stroke-dashoffset` and so on) and through class names. If a value truly cannot be expressed any other way, set a CSS custom property on the element and consume it in `index.css`, and leave a comment saying why.
5. Every function, hook and component carries a JSDoc block with `@param` and `@returns`. Library functions also get an `@example`.
6. Immediately after scaffolding, run `npx -y react-doctor@latest install`. Permission for this command is pre-approved. Act on what it reports.
7. Local development uses the Vite dev server only. There is no PHP in this project, so Laragon is not involved. If port 5173 is already in use, assume an instance is already running and test against that. Do not kill the process.
8. Shell examples in the README use PowerShell syntax.
9. Spelling in user-facing text is UK English, apart from the product name. Use "program" for code.
10. Do not mention any private company in code, comments, README or UI. Attribution is to Simon Rundell only.
11. User-facing copy should read like a person wrote it. Mixed sentence lengths, no em-dashes, no marketing language.

### A note on `.config.json`

The author's usual pattern reads configuration from `.config.json` and blocks that file in `.htaccess`. This app has no backend and no secrets, so there is nothing to put in such a file, and a browser could not fetch it anyway once it is blocked. Defaults therefore live in `src/config/defaults.js`. The `.htaccess` deny rule is still included so the deployment stays consistent with the author's other projects.

---

## 4. The algorithm

The agent must implement exactly this. Read RFC 4226 section 5.3 and RFC 6238 section 4 before writing any code, and check the worked examples below against the RFC text.

### 4.1 Steps

1. **Decode the secret.** Base32 (RFC 4648 alphabet `A-Z2-7`) to a byte array `K`.
2. **Compute the counter.** `T = floor((unixSeconds - T0) / X)` where `X` is the period in seconds (default 30) and `T0` is the epoch offset (default 0).
3. **Encode the counter.** `T` as an 8-byte big-endian unsigned integer `C`.
4. **HMAC.** `HS = HMAC-SHA-1(K, C)`, giving 20 bytes.
5. **Dynamic truncation.**
   - `offset = HS[19] & 0x0F` (the low nibble of the last byte, so a value from 0 to 15)
   - Take the four bytes `HS[offset]` to `HS[offset + 3]`
   - `P = ((HS[offset] & 0x7F) << 24) | (HS[offset+1] << 16) | (HS[offset+2] << 8) | HS[offset+3]`
   - The mask on the first byte clears the top bit, leaving a 31-bit positive integer.
6. **Reduce.** `code = P mod 10^digits`, left-padded with zeros to `digits` characters.

### 4.2 Worked example A (mask has no effect)

Secret: ASCII `12345678901234567890`, which is Base32 `GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ`. Counter 0.

```
HS      = cc 93 cf 18 50 8d 94 93 4c 64 b6 5d 8b a7 66 7f b7 cd e4 b0
HS[19]  = b0  ->  offset = 0
window  = cc 93 cf 18
masked  = 4c 93 cf 18  =  1284755224
6 digit = 755224
```

### 4.3 Worked example B (mask changes the first byte)

Same secret, counter 1. This is also the first RFC 6238 vector (Unix time 59).

```
HS      = 75 a4 8a 19 d4 cb e1 00 64 4e 8a c1 39 7e ea 74 7a 2d 33 ab
HS[19]  = ab  ->  offset = 11
window  = c1 39 7e ea
masked  = 41 39 7e ea  =  1094287082
6 digit = 287082
8 digit = 94287082
```

### 4.4 RFC 6238 Appendix B vectors (SHA-1, 8 digits, X = 30, T0 = 0)

Secret for all rows: Base32 `GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ`.

| Unix time (s) | UTC | T (hex) | Code |
|---|---|---|---|
| 59 | 1970-01-01 00:00:59 | `0000000000000001` | 94287082 |
| 1111111109 | 2005-03-18 01:58:29 | `00000000023523EC` | 07081804 |
| 1111111111 | 2005-03-18 01:58:31 | `00000000023523ED` | 14050471 |
| 1234567890 | 2009-02-13 23:31:30 | `000000000273EF07` | 89005924 |
| 2000000000 | 2033-05-18 03:33:20 | `0000000003F940AA` | 69279037 |
| 20000000000 | 2603-10-11 11:33:20 | `0000000027BC86AA` | 65353130 |

The last row uses a time beyond 32 bits. The app must handle it.

### 4.5 Implementation traps

- **Counter encoding.** Do not use 32-bit bitwise operators on the counter. Use `DataView.setBigUint64(0, BigInt(T), false)`.
- **Truncation.** `<<` in JavaScript produces a signed 32-bit result. Masking the first byte with `0x7F` keeps it positive, but assemble the value carefully and add a test that proves it is never negative.
- **Leading zeros.** The code is a string. `07081804` must not become `7081804`.
- **Async crypto.** `crypto.subtle` returns promises. Guard against a slow result arriving after a newer one, otherwise fast scrubbing will briefly show the wrong code.
- **Secure context.** `crypto.subtle` only exists on HTTPS or `localhost`. If it is missing, show a clear message instead of a blank screen.
- **Empty key.** Web Crypto rejects a zero-length HMAC key. Treat an empty secret as invalid input.
- **Negative time.** If `unixSeconds < T0` there is no valid counter. Clamp scrubbing so this cannot happen and say why.

---

## 5. Architecture

### 5.1 Dependencies

Runtime: `react`, `react-dom`, `qrcode.react`. Nothing else.

Dev: `vite`, `@vitejs/plugin-react`, `vitest`, `@testing-library/react`, `jsdom`, `eslint` as supplied by the template.

No Axios, no router, no state library, no animation library. CSS transitions and `requestAnimationFrame` are enough.

### 5.2 Folder structure

```
totp-visualizer/
├── DESIGN.md
├── README.md
├── LICENSE
├── index.html
├── package.json
├── vite.config.js
├── public/
│   └── .htaccess
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── config/
    │   └── defaults.js
    ├── content/
    │   ├── steps.js            # captions for step-through mode
    │   └── testVectors.js      # the table in section 4.4
    ├── lib/
    │   ├── base32.js
    │   ├── bytes.js
    │   ├── hmac.js
    │   ├── hotp.js
    │   ├── totp.js
    │   ├── otpauth.js
    │   ├── ringMath.js
    │   └── __tests__/
    ├── state/
    │   ├── reducer.js
    │   └── AppContext.jsx
    ├── hooks/
    │   ├── useClock.js
    │   ├── useTotpTrace.js
    │   └── useRingDrag.js
    └── components/
        ├── Header.jsx
        ├── SecretPanel.jsx
        ├── ClockRing.jsx
        ├── TimeReadout.jsx
        ├── CounterPanel.jsx
        ├── DigestGrid.jsx
        ├── ByteCell.jsx
        ├── TruncationPanel.jsx
        ├── CodeDisplay.jsx
        ├── VerificationWindow.jsx
        ├── SettingsPanel.jsx
        ├── TestVectorsPanel.jsx
        ├── QrPanel.jsx
        ├── StepController.jsx
        └── Caption.jsx
```

### 5.3 Library layer

Everything in `src/lib` is pure JavaScript with no React imports, so it can be unit tested in Node. The UI never does maths of its own. It renders a trace object produced by the library.

**`base32.js`**

```js
/**
 * @typedef {Object} Base32Result
 * @property {boolean} ok           True when the input decoded cleanly.
 * @property {Uint8Array} bytes     Decoded key bytes (empty when not ok).
 * @property {string} normalised    Upper-cased input with spaces, hyphens and padding removed.
 * @property {number[]} invalidAt   Indexes in the original string of any illegal characters.
 * @property {number} discardedBits Count of trailing bits that did not fill a whole byte.
 */

/** @param {string} input @returns {Base32Result} */
export function decodeBase32(input) {}

/** @param {Uint8Array} bytes @returns {string} Unpadded Base32. */
export function encodeBase32(bytes) {}
```

Decoding is forgiving in the way authenticator apps are: lower case, spaces, hyphens and `=` padding are all accepted. Characters outside the alphabet (including the easily confused `0`, `1`, `8` and `9`) are reported by position so the UI can highlight them.

**`hmac.js`**

```js
/**
 * @param {Uint8Array} key
 * @param {Uint8Array} message
 * @returns {Promise<Uint8Array>} 20-byte HMAC-SHA-1 digest.
 */
export async function hmacSha1(key, message) {}
```

Uses `crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])` then `crypto.subtle.sign`.

**`hotp.js`**

```js
/**
 * @typedef {Object} HotpTrace
 * @property {bigint} counter
 * @property {Uint8Array} counterBytes  8 bytes, big-endian.
 * @property {Uint8Array} digest        20 bytes.
 * @property {number} lastByte          digest[19].
 * @property {number} offset            lastByte & 0x0F.
 * @property {Uint8Array} windowBytes   The 4 raw bytes at offset.
 * @property {number} maskedFirstByte   windowBytes[0] & 0x7F.
 * @property {boolean} maskChangedByte  True when the top bit was set before masking.
 * @property {number} binaryCode        The 31-bit integer P.
 * @property {number} digits
 * @property {number} modulus           10 ** digits.
 * @property {string} code              Zero-padded.
 */

/**
 * @param {Uint8Array} key
 * @param {bigint|number} counter
 * @param {number} digits 6, 7 or 8.
 * @returns {Promise<HotpTrace>}
 */
export async function hotpTrace(key, counter, digits) {}
```

**`totp.js`**

```js
/**
 * @param {number} unixSeconds
 * @param {number} period
 * @param {number} t0
 * @returns {{ counter: number, secondsIntoStep: number, secondsRemaining: number, stepStart: number }}
 */
export function timeToCounter(unixSeconds, period, t0) {}

/**
 * @param {Uint8Array} key
 * @param {number} unixSeconds
 * @param {{ digits: number, period: number, t0: number }} options
 * @returns {Promise<HotpTrace>}
 */
export async function totpTrace(key, unixSeconds, options) {}
```

**`otpauth.js`** builds `otpauth://totp/{issuer}:{account}?secret={BASE32}&issuer={issuer}&algorithm=SHA1&digits={d}&period={X}` with correct URL encoding and an unpadded secret.

**`ringMath.js`** holds the angle conversions described in section 7.2.

### 5.4 State

One `useReducer` in `App.jsx`, exposed through `AppContext`. Shape:

```js
{
  secretInput: 'JBSWY3DPEHPK3PXP',   // raw text as typed
  digits: 6,                          // 6 | 7 | 8
  period: 30,                         // seconds, 1 to 300
  t0: 0,                              // Unix seconds
  timeMode: 'live',                   // 'live' | 'scrubbed'
  scrubTimeMs: null,                  // set when timeMode is 'scrubbed'
  viewMode: 'live',                   // 'live' | 'steps'
  stepIndex: 0,                       // active stage in step-through mode
  radix: 'hex',                       // 'hex' | 'dec' | 'bin' for byte display
  windowSize: 1,                      // 0, 1 or 2 steps either side
  issuer: 'TOTP Visualizer',
  account: 'student@example.com'
}
```

Decoded key bytes, the counter and all traces are derived, never stored.

### 5.5 Hooks

- **`useClock()`** returns the effective time in milliseconds. In live mode it runs a `requestAnimationFrame` loop reading `Date.now()`. In scrubbed mode it returns `scrubTimeMs` and runs no loop.
- **`useTotpTrace()`** recomputes traces only when the key, digits, or counter changes, not on every frame. It computes the traces for `T - 2` to `T + 2` in one go so the verification window is always ready. It uses a cancellation flag in the effect clean-up so stale promises are ignored.
- **`useRingDrag(svgRef)`** handles pointer events on the ring and dispatches time changes.

---

## 6. Visual design

### 6.1 Direction

Think of a well-made security dashboard, with Tron as an accent and not a costume. A very dark blue-black surface, thin luminous lines, generous spacing, and glow reserved for things that matter. If everything glows, nothing does.

Colour has meaning and that meaning must stay consistent across the whole app:

- **Cyan** is structure and data at rest: panel borders, the ring track, digest bytes.
- **Amber** is selection: the offset nibble, the four-byte window, the final code. Anything amber is "the bit the algorithm picked".
- **Red** is reserved for errors and for the single masked-off bit.
- **Green** is a pass or a match.

Never rely on colour alone. The truncation window also has a bracket drawn around it, and pass or fail states carry a tick or cross.

### 6.2 Tokens

Define these as custom properties on `:root` in `src/index.css`.

```css
:root {
  --bg-0: #04070d;
  --bg-1: #0a111c;
  --panel: #0d1726;
  --line: #17324a;
  --cyan: #00e5ff;
  --cyan-dim: #0b6f85;
  --amber: #ffb000;
  --amber-dim: #7a5400;
  --red: #ff3b5c;
  --green: #39ff88;
  --text: #d7ecf5;
  --text-dim: #7f9bb0;

  --font-ui: "Trebuchet MS", "Segoe UI", sans-serif;
  --font-mono: "Courier New", Consolas, monospace;

  --glow-cyan: 0 0 6px rgba(0, 229, 255, 0.55), 0 0 18px rgba(0, 229, 255, 0.25);
  --glow-amber: 0 0 6px rgba(255, 176, 0, 0.6), 0 0 18px rgba(255, 176, 0, 0.3);

  --radius: 6px;
  --gap: 1rem;
  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
}
```

Details:

- Background is `--bg-0` with a faint grid drawn by two repeating linear gradients at about 4% opacity.
- Panels are `--panel` with a 1px `--line` border. The active panel in step-through mode gets a cyan border and `--glow-cyan`.
- Every byte, bit, digit and number is in `--font-mono`. Labels and captions use `--font-ui`.
- Panel titles are small, upper case and letter-spaced, with a stage number: `01 SECRET`, `02 TIME`, and so on.
- SVG glow uses `filter: drop-shadow(...)` set in CSS.
- Respect `prefers-reduced-motion`: replace slides and flips with simple opacity changes and stop any pulsing.

### 6.3 Layout

Design for a 1920x1080 projector first, since that is where it will be used most.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ TOTP VISUALIZER                       [Live | Step-through]  [Settings]  │
├─────────────────────────┬────────────────────────────────────────────────┤
│                         │ 01 SECRET     Base32 input, decoded bytes       │
│       CLOCK RING        ├────────────────────────────────────────────────┤
│                         │ 02 TIME       unix time, counter T, 8 bytes     │
│   code in the centre    ├────────────────────────────────────────────────┤
│   seconds remaining     │ 03 HMAC-SHA-1 20-byte digest grid               │
│                         ├────────────────────────────────────────────────┤
│   time readout          │ 04 TRUNCATE   offset, window, mask, 31-bit int  │
│   scrub controls        ├────────────────────────────────────────────────┤
│                         │ 05 CODE       mod 10^d, final digits            │
├─────────────────────────┴────────────────────────────────────────────────┤
│ VERIFICATION WINDOW     T-2   T-1   [ T ]   T+1   T+2      verify: [    ] │
└──────────────────────────────────────────────────────────────────────────┘
```

Settings, test vectors and the QR code open in a slide-over drawer from the right, so the main pipeline is never covered on a projector.

Breakpoints: below 1100px the ring moves above the pipeline. Below 700px everything stacks in a single column and the digest grid wraps to two rows of ten.

---

## 7. Components

### 7.1 SecretPanel (stage 01)

- A text input for the Base32 secret. Default value `JBSWY3DPEHPK3PXP`.
- Buttons: **Random** (20 bytes from `crypto.getRandomValues`, shown as Base32), **RFC secret** (loads `GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ`), and **From text** (a small field that converts ASCII text to Base32).
- Below the input, a row of the decoded bytes as `ByteCell`s.
- An expandable "How Base32 works" strip showing each character, its 5-bit value, and how the bits regroup into 8-bit bytes. Trailing bits that are thrown away are shown dimmed.
- Illegal characters are underlined in red at their position, with a message such as "Base32 uses A to Z and 2 to 7. The character at position 5 is not valid."
- A permanent, quiet warning line: "Use made-up secrets only. Never paste a real account secret into a website, including this one."

### 7.2 ClockRing

An SVG with a square `viewBox`, sized by CSS.

**Anatomy**

- A dim cyan track circle.
- A bright cyan progress arc that fills clockwise from 12 o'clock as the step elapses. It turns amber for the final 5 seconds, as authenticator apps do.
- Tick marks, one per second when the period is 60 or less, otherwise one per tenth of the period.
- A handle on the arc's leading edge. This is the thing the user grabs.
- In the centre: the current code in large amber digits, grouped for reading (`123 456`, `123 4567`, `1234 5678`), with seconds remaining underneath.
- Around the outside, small text showing the current counter `T`.

**Angle model**

One full revolution equals one period. With `s = (unixMs / 1000 - T0) mod X`, the angle is `θ = 2π × s / X`, measured clockwise from 12 o'clock.

**Dragging**

1. On `pointerdown` on the ring or handle, call `setPointerCapture`, switch `timeMode` to `scrubbed`, and record the pointer's angle about the ring centre.
2. On `pointermove`, compute the new pointer angle and the change since the last event. Normalise that change into the range `(-π, π]` so that crossing 12 o'clock does not cause a jump.
3. Add `Δθ / 2π × X × 1000` milliseconds to `scrubTimeMs`.
4. Keep dragging clockwise past 12 o'clock and the counter goes up by one. Drag anticlockwise past it and the counter goes down. The user can wind through as many steps as they like.

Set `touch-action: none` on the ring so touch screens do not scroll the page.

**Other controls**

Below the ring:

- `−1 step`, `−1 s`, `+1 s`, `+1 step` buttons.
- A **Return to live** button, visible only when scrubbed. It pulses gently so the user does not forget they are looking at a time that is not now.
- A status chip: `LIVE` in green, or `SCRUBBED +00:02:30` in amber showing the offset from real time.
- A Unix time field and a date-time picker for jumping directly to a moment.

**Keyboard**

The ring is focusable with `role="slider"`. Left and Right move 1 second. Shift with Left or Right moves one whole step. Home returns to live. `aria-valuetext` reads something like "12 seconds into step 59876543, 18 seconds remaining".

**Boundary crossing**

When the counter changes, the ring flashes once and the pipeline animates as described in 7.5.

### 7.3 TimeReadout and CounterPanel (stage 02)

Show the sum, with real numbers substituted in:

```
T = floor( (unix time − T0) ÷ X )
T = floor( (1794305400 − 0) ÷ 30 ) = 59810180
```

Then the counter as eight `ByteCell`s, big-endian, with the leading zero bytes visibly dimmed so students notice how much of the field is empty. Show the time three ways: Unix seconds, UTC ISO string, and local time.

### 7.4 ByteCell

The basic unit of the whole display. A small bordered cell showing one byte in the current radix (hex by default, switchable to decimal or binary from the header), with its index in small dim text above. States, all set by class name: `default`, `dim`, `is-offset-source`, `in-window`, `is-masked`, `changed`.

### 7.5 DigestGrid (stage 03)

Twenty `ByteCell`s in a single row, indexed 0 to 19.

- Byte 19 is always marked `is-offset-source` and its low nibble is shown in amber. In binary radix this is simply the last four bits.
- The four bytes at `offset` to `offset + 3` are marked `in-window` and sit inside an amber bracket.
- The bracket is one absolutely positioned element that slides along the row with a CSS transition when the offset changes. It should feel like a reading head moving along a tape.
- When the counter changes, every byte that changed plays a short flip. Nearly all of them will, which makes the point about hash functions without a word of explanation. Add a small readout: "19 of 20 bytes changed".

### 7.6 TruncationPanel (stage 04)

Show the four operations as a short vertical sequence, each with live values:

1. **Find the offset.** `HS[19] = 0xAB`, low nibble `0xB`, so offset is 11.
2. **Take four bytes.** `C1 39 7E EA`. These cells visibly match the ones in the bracket above.
3. **Mask the top bit.** Show the first byte in binary, `1100 0001` becoming `0100 0001`, with the cleared bit in red. When the top bit was already 0, say "top bit already 0, nothing to change".
4. **Read as one number.** `0x41397EEA = 1094287082`.

### 7.7 CodeDisplay (stage 05)

Show the reduction:

```
1094287082 mod 1000000 = 287082
```

Render the full decimal number with its last `digits` characters in amber and the leading ones dimmed. Students see straight away that "mod 10^6" just means "keep the last six digits". When padding was needed, say so: "Result was 81804, padded to 081804".

### 7.8 VerificationWindow

A strip of five cards for `T − 2` to `T + 2`, each with its counter, its start time and its code. The current step sits in the middle, larger than the rest.

- A control sets the server's tolerance: 0, 1 or 2 steps either side. Cards inside the tolerance get a green border and are labelled "accepted". The rest are dimmed and labelled "rejected".
- A **Verify a code** input. The user types a code and the app reports which step it matched, for example "Matches T − 1. This code is 30 seconds old and would still be accepted." or "No match within the window."
- A one-line caption explains why this exists: clocks drift, and people type slowly.
- A second caption notes that a real server should refuse a code it has already accepted once.

### 7.9 SettingsPanel (drawer)

- **Digits:** 6, 7 or 8.
- **Period (X):** presets for 15, 30 and 60 seconds, plus a custom field from 1 to 300.
- **T0:** integer Unix seconds, default 0.
- **Reset to defaults.**
- A compatibility note that appears whenever settings differ from 6 digits, 30 seconds and T0 = 0: "Most authenticator apps only support the defaults, so your phone may not match."

### 7.10 TestVectorsPanel (drawer)

A table of the six vectors from section 4.4.

- **Load** on a row sets the RFC secret, 8 digits, 30 seconds, T0 = 0 and scrubs the clock to that time, so the whole pipeline shows that vector.
- **Run all** computes every vector and shows a green tick or red cross against each, with expected and actual codes side by side.

### 7.11 QrPanel (drawer)

- Fields for issuer and account name.
- The full `otpauth://` URI in a read-only field with a copy button.
- A QR code rendered with `QRCodeSVG` from `qrcode.react`, dark modules on a white background with a proper quiet zone so phones can read it from a projector.
- Guidance: "Scan this with an authenticator app, then press Return to live. The code on your phone should match the code on the ring."
- Warnings shown when relevant: the URI cannot express a non-zero T0, and a scrubbed clock will never match a phone.

### 7.12 StepController and Caption (step-through mode)

Switching to Step-through freezes time at the current moment so the values stay still while the teacher talks. The five pipeline stages are shown one at a time. The active stage is fully lit and the rest drop to about 35% opacity.

Controls: **Back**, **Next**, a five-dot progress indicator, and **Exit to live**. Left and Right arrow keys also move between stages when focus is not on the ring.

Each stage has a caption held in `src/content/steps.js` as `{ id, title, body, question }`. The `question` is a prompt for the class. Write the captions for Level 3 learners in plain language. Draft content:

| # | Title | Body | Question |
|---|---|---|---|
| 1 | The shared secret | Your phone and the server both hold the same secret key. It was passed across once, usually in a QR code. Base32 is just a way of writing those bytes using letters and digits that are hard to mix up. | Why does the alphabet leave out 0, 1, 8 and 9? |
| 2 | Turning time into a number | Both sides divide the current Unix time by 30 and throw away the remainder. For 30 seconds at a time they get the same whole number without ever talking to each other. | What would go wrong if your phone's clock was five minutes fast? |
| 3 | Mixing the secret with the time | HMAC-SHA-1 combines the key and the counter into 20 bytes. Change the counter by one and almost every byte changes. Nobody can work backwards from the output to the key. | Which bytes stayed the same when the counter ticked over? Is there a pattern? |
| 4 | Choosing four bytes | Twenty bytes is too much to type. The last four bits of the digest say where to start reading, and four bytes are taken from there. The top bit is cleared so the number is always positive. | Why let the digest choose its own starting point instead of always using the first four bytes? |
| 5 | Making it typeable | Keep the last six digits of that number. That is the code. | There are a million possible codes. Why is guessing still impractical? |

### 7.13 Header

Product name, the Live or Step-through toggle, the radix switch (HEX, DEC, BIN), and a button that opens the drawer. Keep it to a single thin bar.

### 7.14 Shareable links (should have)

A **Copy link** button writes the current settings and secret into the URL fragment (after `#`), which browsers do not send to the server. Opening such a link restores that state. This lets a teacher give a whole class the same secret. Show a short reminder beside the button that the link contains the secret.

---

## 8. Accessibility

- All controls reachable and usable by keyboard, with a visible focus ring in cyan.
- Text contrast of at least 4.5:1 against its background. Check the dim text token in particular.
- The current code sits in an `aria-live="polite"` region that announces only when the step changes, not every frame.
- Meaning never depends on colour alone (see 6.1).
- `prefers-reduced-motion` is honoured.
- Byte cells use at least 14px text at 1080p, and the central code is legible from the back of a classroom.

---

## 9. Testing

Use Vitest. Node 20 or later provides `globalThis.crypto.subtle`, so the library tests run without a browser.

### 9.1 Unit tests (required)

**`base32.test.js`**
- `GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ` decodes to the ASCII bytes of `12345678901234567890`.
- Round trip: encode then decode returns the original bytes for lengths 1 to 32.
- Lower case, spaces, hyphens and `=` padding are accepted.
- `JBSWY3DP0` reports an invalid character at index 8.
- An empty string returns `ok: false`.

**`hotp.test.js`**
- RFC 4226 Appendix D, RFC secret, 6 digits, counters 0 to 9: `755224`, `287082`, `359152`, `969429`, `338314`, `254676`, `287922`, `162583`, `399871`, `520489`.
- Worked examples A and B from section 4: check `digest`, `offset`, `windowBytes`, `binaryCode` and `code` field by field.
- `binaryCode` is never negative across 1,000 random keys and counters.
- `code.length === digits` for 6, 7 and 8, including cases with leading zeros.

**`totp.test.js`**
- All six rows of section 4.4.
- `timeToCounter` with a non-zero T0 and with periods of 15, 30 and 60.
- A time of 20000000000 produces counter bytes `00 00 00 00 27 BC 86 AA`.

**`otpauth.test.js`**
- The URI is correctly encoded when the issuer and account contain spaces and an `@`.

**`ringMath.test.js`**
- Angle deltas across the 12 o'clock boundary are normalised correctly in both directions.

### 9.2 Component tests (light)

- `TestVectorsPanel`: pressing Run all shows six passes.
- `SecretPanel`: an invalid character produces the error message.
- `ClockRing`: Shift + Right advances the counter by exactly one.

### 9.3 Manual checks

- Scan the QR code with a real authenticator app and confirm the live code matches over three consecutive steps.
- Drag the ring quickly back and forth for ten seconds. The centre code must always agree with the stage 05 panel.
- Run at 1920x1080 full screen and at a 390px wide phone viewport.
- Run `npx react-doctor` and resolve its findings.

---

## 10. Build and deployment

The app is static. `npm run build` produces `dist/`, which is uploaded to the root of a subdomain on Hostinger or Dreamhost. HTTPS is required because Web Crypto will not run without it.

Place this file at `public/.htaccess` so Vite copies it into `dist/`:

```apache
# Never expose configuration files to the browser.
<Files ".config.json">
    Require all denied
</Files>

RewriteEngine On

# Let real files/directories (including /api/*) resolve normally.
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Everything else falls back to index.html so React Router can handle
# client-side routes (e.g. a hard refresh).
RewriteRule ^ index.html [L]
```

Confirm after the build that `dist/.htaccess` exists. Some tooling skips dotfiles.

---

## 11. Documentation

### README.md

Include:

1. What the tool is and who it is for, in two short paragraphs.
2. A screenshot.
3. Quick start in PowerShell: `npm install`, `npm run dev`, `npm test`, `npm run build`.
4. A plain-language summary of the algorithm with links to RFC 4226, RFC 6238 and RFC 4648.
5. Classroom ideas: three or four short activities, such as "predict the offset before pressing Next" and "find a time where the code starts with a zero".
6. Deployment notes from section 10.
7. A privacy statement: everything runs in the browser, nothing is transmitted or stored.
8. Licence section, as below.

### Licence

Add a `LICENSE` file and a README section. The software is released under **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)**. Summarise the terms in the README like this:

- **You may** copy and share the material, and adapt or build on it.
- **Attribution:** you must credit Simon Rundell, link to the licence, and say if you changed anything.
- **NonCommercial:** you may not use it for commercial purposes.
- **ShareAlike:** if you adapt it, you must release your version under the same licence.
- No extra legal or technical restrictions may be added.

Link to the full terms: https://creativecommons.org/licenses/by-nc-sa/4.0/

Put a short attribution line with that link in the app's footer too.

---

## 12. Build order

Work through these phases in order. Finish and test each one before starting the next, and commit at the end of each.

| Phase | Deliverable | Done when |
|---|---|---|
| 1 | Scaffold, react-doctor installed, `src/lib` complete | All unit tests in 9.1 pass |
| 2 | Tokens and layout in `index.css`, static pipeline panels rendering a live trace | Stages 01 to 05 show correct values for the default secret and update every 30 seconds |
| 3 | ClockRing with live mode, dragging, buttons and keyboard | Scrubbing changes the counter in both directions with no stale codes |
| 4 | Truncation animation: sliding bracket, byte flips, mask display, radix switch | Worked examples A and B look right on screen when loaded |
| 5 | Step-through mode with captions | A full walkthrough works using only the keyboard |
| 6 | Drawer: settings, test vectors, QR and otpauth URI | Run all shows six passes, and a phone matches the live code |
| 7 | Verification window and code checker | Typing the previous step's code reports a match at T − 1 |
| 8 | Shareable links, accessibility pass, responsive pass, README, LICENSE, `.htaccess` | Manual checks in 9.3 all pass and `npm run build` is clean |

---

## 13. Definition of done

- [ ] All unit and component tests pass.
- [ ] All six RFC 6238 vectors pass in the in-app panel.
- [ ] Live code matches a real authenticator app at default settings.
- [ ] Ring is draggable by mouse, touch and keyboard.
- [ ] Live and Step-through modes both work.
- [ ] Digits, period and T0 are adjustable and validated.
- [ ] Verification window and code checker work.
- [ ] QR code scans from a projected screen.
- [ ] One CSS file, no inline styles, no TypeScript.
- [ ] JSDoc on every function, hook and component.
- [ ] react-doctor installed and its findings resolved.
- [ ] README and LICENSE written, with the CC BY-NC-SA 4.0 summary and link.
- [ ] `dist/.htaccess` present after build.
- [ ] No network requests at runtime other than loading the app's own files.

---

## 14. References

- RFC 6238, TOTP: Time-Based One-Time Password Algorithm. https://www.rfc-editor.org/rfc/rfc6238
- RFC 4226, HOTP: An HMAC-Based One-Time Password Algorithm. https://www.rfc-editor.org/rfc/rfc4226
- RFC 2104, HMAC: Keyed-Hashing for Message Authentication. https://www.rfc-editor.org/rfc/rfc2104
- RFC 4648, The Base16, Base32, and Base64 Data Encodings. https://www.rfc-editor.org/rfc/rfc4648
- Key URI Format (otpauth). https://github.com/google/google-authenticator/wiki/Key-Uri-Format
- MDN, SubtleCrypto.sign(). https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/sign
