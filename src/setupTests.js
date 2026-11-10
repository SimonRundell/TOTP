import { afterEach } from 'vitest';
import { webcrypto } from 'node:crypto';

/**
 * Test setup shared by every Vitest file.
 * jsdom's window.crypto has no SubtleCrypto, so component tests borrow Node's Web Crypto.
 * React Testing Library only cleans up automatically when Vitest globals are on, so do it here.
 */
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
}

afterEach(async () => {
  if (typeof document !== 'undefined') {
    const { cleanup } = await import('@testing-library/react');
    cleanup();
  }
});
