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
      const proxy = runtimeDynamicImportAdapterProxy();
      const path = './runtime-dynamic-import-adapter';

      proxy.succeeds({ path, module: { runtimeDynamicImportAdapter: 'test-value' } });

      const result = await runtimeDynamicImportAdapter({ path });

      expect((result as { runtimeDynamicImportAdapter: unknown }).runtimeDynamicImportAdapter).toBe(
        runtimeDynamicImportAdapter,
      );
    });

    it('ERROR: {path: nonexistent path} => rejects with module not found error', async () => {
      const proxy = runtimeDynamicImportAdapterProxy();
      const path = '/nonexistent';

      proxy.throws({ path, error: new Error('Cannot find module') });

      await expect(runtimeDynamicImportAdapter({ path })).rejects.toThrow(/Cannot find module/u);
    });
  });
});
