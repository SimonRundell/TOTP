/**
 * Builds an otpauth:// URI in the Key URI Format that authenticator apps read from QR codes.
 * The format has no field for T0, so the app assumes T0 = 0.
 *
 * @param {string} issuer The issuer name, such as the service.
 * @param {string} account The account name, such as an email address.
 * @param {string} secret The Base32 secret. Any padding is removed.
 * @param {{ digits?: number, period?: number }} [options] Code length and period X.
 * @returns {string} The otpauth URI.
 * @example
 * buildOtpauthUri('TOTP Visualizer', 'student@example.com', 'JBSWY3DPEHPK3PXP', { digits: 6, period: 30 })
 * // 'otpauth://totp/TOTP%20Visualizer:student%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=TOTP%20Visualizer&algorithm=SHA1&digits=6&period=30'
 */
export function buildOtpauthUri(issuer, account, secret, options = {}) {
  const safeIssuer = encodeURIComponent(issuer || 'TOTP Visualizer');
  const safeAccount = encodeURIComponent(account || 'student@example.com');
  const safeSecret = (secret || '').replace(/=/g, '');
  const digits = Number(options.digits) || 6;
  const period = Number(options.period) || 30;

  return `otpauth://totp/${safeIssuer}:${safeAccount}?secret=${safeSecret}&issuer=${safeIssuer}&algorithm=SHA1&digits=${digits}&period=${period}`;
}
