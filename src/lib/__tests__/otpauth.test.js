import { test } from 'vitest';
import assert from 'node:assert/strict';

import { buildOtpauthUri } from '../otpauth.js';

test('The otpauth URI is correctly encoded when issuer and account contain spaces and @', () => {
  const uri = buildOtpauthUri('My School IT', 'jo bloggs@example.com', 'JBSWY3DPEHPK3PXP', { digits: 6, period: 30 });
  assert.equal(
    uri,
    'otpauth://totp/My%20School%20IT:jo%20bloggs%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=My%20School%20IT&algorithm=SHA1&digits=6&period=30',
  );
});

test('Padding is removed from the secret', () => {
  const uri = buildOtpauthUri('A', 'b', 'GEZDGNBV====', { digits: 8, period: 60 });
  assert.match(uri, /secret=GEZDGNBV&/);
  assert.match(uri, /digits=8&period=60$/);
});
