# TOTP Visualizer

TOTP Visualizer is a browser-based teaching tool for showing how Time-based One-Time Passwords work. It is designed for students and teachers in further education who want to see the real steps behind authenticator apps, from the shared secret to the final six-digit code.

The app runs entirely in the browser, so no backend is required. It decodes a Base32 secret, converts the clock into a counter, performs an HMAC-SHA-1 step, truncates the digest, and shows the final code in context.

## Screenshot

![TOTP Visualizer at 1920x1080, showing the clock ring and the five pipeline stages](docs/screenshot.png)

## Quick start

```powershell
npm install
npm run dev      # Vite dev server on http://localhost:5173
npm test         # Vitest: library and component tests
npm run build    # static site in dist/
```

## How the algorithm works

The app follows the standard TOTP algorithm described in RFC 4226 and RFC 6238:

1. Decode the Base32 secret into bytes.
2. Convert Unix time into a counter using the configured period and T0.
3. Build an 8-byte big-endian counter value.
4. Compute HMAC-SHA-1 over the key and counter.
5. Use the low nibble of the final byte as the offset.
6. Take four bytes from that offset and mask the top bit.
7. Convert that integer to a code string with a modulo of 10^digits.

Useful references:
- RFC 4226: https://www.rfc-editor.org/rfc/rfc4226
- RFC 6238: https://www.rfc-editor.org/rfc/rfc6238
- RFC 4648: https://www.rfc-editor.org/rfc/rfc4648

## Classroom ideas

- Predict the offset before stepping through the digest.
- Find a time where the final code starts with a zero.
- Compare the live code against the verification window.
- Change the period or T0 and discuss why the output changes.

## Deployment notes

The app is static. `npm run build` produces `dist/`. Upload its contents to the root of a subdomain on any Apache host.

- HTTPS is required. Web Crypto, which does the HMAC step, only runs on HTTPS or on `localhost`. On plain HTTP the app shows a message instead of the visualizer.
- `public/.htaccess` is copied into `dist/` by the build. It denies access to any `.config.json` (kept for consistency with the author's other projects, though this app has none) and sends unknown paths to `index.html`. Some upload tools skip dotfiles, so check it arrived.

```powershell
npm run build
Get-ChildItem dist -Force   # confirm .htaccess is present
```

## Privacy

Everything runs in the browser. Nothing is transmitted or stored. The secret only leaves the page if you choose **Copy link**, which puts it in the part of the address after `#`. Browsers never send that part to the server, but anyone you give the link to can read it, so only share made-up secrets.

## Licence

This software is released under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International licence.

- **You may** copy and share the material, and adapt or build on it.
- **Attribution:** you must credit Simon Rundell, link to the licence, and say if you changed anything.
- **NonCommercial:** you may not use it for commercial purposes.
- **ShareAlike:** if you adapt it, you must release your version under the same licence.
- No extra legal or technical restrictions may be added.

Full licence: https://creativecommons.org/licenses/by-nc-sa/4.0/
