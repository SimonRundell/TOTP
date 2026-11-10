/**
 * Creates an HMAC-SHA-1 digest for a key and message.
 *
 * @param {Uint8Array} key The HMAC key bytes.
 * @param {Uint8Array} message The message bytes.
 * @returns {Promise<Uint8Array>} A 20-byte digest.
 * @example
 * const digest = await hmacSha1(key, counterBytes); // digest.length === 20
 */
export async function hmacSha1(key, message) {
  if (!(key instanceof Uint8Array) || !(message instanceof Uint8Array)) {
    throw new Error('HMAC input must be Uint8Array values.');
  }

  if (!globalThis.crypto || !globalThis.crypto.subtle) {
    throw new Error('Web Crypto is not available in this context.');
  }

  if (key.length === 0) {
    throw new Error('An empty secret is not valid for HMAC.');
  }

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );

  const digest = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return new Uint8Array(digest);
}
