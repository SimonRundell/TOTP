/**
 * Reads and writes the shareable URL fragment (the part after #).
 * Browsers never send the fragment to the server, so the secret stays on the device.
 */

/**
 * Builds the fragment text for the current secret and settings.
 *
 * @param {{ secretInput: string, digits: number, period: number, t0: number }} settings The values to share.
 * @returns {string} Fragment text without the leading #.
 * @example
 * buildShareHash({ secretInput: 'JBSWY3DP', digits: 6, period: 30, t0: 0 }) // 's=JBSWY3DP&d=6&p=30&t0=0'
 */
export function buildShareHash({ secretInput, digits, period, t0 }) {
  const params = new URLSearchParams({
    s: secretInput,
    d: String(digits),
    p: String(period),
    t0: String(t0),
  });
  return params.toString();
}

/**
 * Parses a fragment back into settings. Invalid or missing values are left out.
 *
 * @param {string} hash Fragment text, with or without the leading #.
 * @returns {{ secretInput?: string, digits?: number, period?: number, t0?: number }} The settings found.
 * @example
 * parseShareHash('#s=JBSWY3DP&d=8') // { secretInput: 'JBSWY3DP', digits: 8 }
 */
export function parseShareHash(hash) {
  const params = new URLSearchParams((hash || '').replace(/^#/, ''));
  /** @type {{ secretInput?: string, digits?: number, period?: number, t0?: number }} */
  const result = {};

  const secret = params.get('s');
  if (secret) {
    result.secretInput = secret;
  }

  const digits = Number(params.get('d'));
  if ([6, 7, 8].includes(digits)) {
    result.digits = digits;
  }

  const period = Number(params.get('p'));
  if (Number.isInteger(period) && period >= 1 && period <= 300) {
    result.period = period;
  }

  const t0Text = params.get('t0');
  const t0 = Number(t0Text);
  if (t0Text !== null && Number.isInteger(t0) && t0 >= 0 && t0 * 1000 <= Date.now()) {
    result.t0 = t0;
  }

  return result;
}
