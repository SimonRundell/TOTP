/** RFC 6238 Appendix B test vectors for SHA-1 (8 digits, X = 30, T0 = 0). */
export const testVectors = [
  {
    label: '59 seconds',
    unixSeconds: 59,
    expected: '94287082',
    tHex: '0000000000000001',
  },
  {
    label: '1111111109',
    unixSeconds: 1111111109,
    expected: '07081804',
    tHex: '00000000023523EC',
  },
  {
    label: '1111111111',
    unixSeconds: 1111111111,
    expected: '14050471',
    tHex: '00000000023523ED',
  },
  {
    label: '1234567890',
    unixSeconds: 1234567890,
    expected: '89005924',
    tHex: '000000000273EF07',
  },
  {
    label: '2000000000',
    unixSeconds: 2000000000,
    expected: '69279037',
    tHex: '0000000003F940AA',
  },
  {
    label: '20000000000',
    unixSeconds: 20000000000,
    expected: '65353130',
    tHex: '0000000027BC86AA',
  },
];
