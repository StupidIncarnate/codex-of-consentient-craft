/**
 * PURPOSE: Tests for runtime dynamic import adapter
 *
 * NOTE: Dynamic import() returns a module namespace object where each named export
 * becomes a property. The generic T represents this module shape.
 */

import { runtimeDynamicImportAdapter } from './runtime-dynamic-import-adapter';
import { runtimeDynamicImportAdapterProxy } from './runtime-dynamic-import-adapter.proxy';

describe('runtimeDynamicImportAdapter', () => {
  describe('importing modules', () => {
    it('VALID: {path: module path} => returns module namespace object with named exports', async () => {
      runtimeDynamicImportAdapterProxy({ module: { runtimeDynamicImportAdapter: 'test-value' } });

      const result = await runtimeDynamicImportAdapter({
        path: './runtime-dynamic-import-adapter',
      });

      expect((result as { runtimeDynamicImportAdapter: unknown }).runtimeDynamicImportAdapter).toBe(
        runtimeDynamicImportAdapter,
      );
    });

    it('ERROR: {path: nonexistent path} => rejects with module not found error', async () => {
      runtimeDynamicImportAdapterProxy({ module: new Error('Cannot find module') });

      await expect(runtimeDynamicImportAdapter({ path: '/nonexistent' })).rejects.toThrow(
        /Cannot find module/u,
      );
    });
  });
});
