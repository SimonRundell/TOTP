/**
 * Default values for the app state. This app has no backend and no secrets of its own,
 * so there is no .config.json. See DESIGN.md section 3.
 */
export const defaults = {
  secretInput: 'JBSWY3DPEHPK3PXP',
  digits: 6,
  period: 30,
  t0: 0,
  timeMode: 'live',
  scrubTimeMs: null,
  viewMode: 'live',
  stepIndex: 0,
  radix: 'hex',
  windowSize: 1,
  issuer: 'TOTP Visualizer',
  account: 'student@example.com',
};
