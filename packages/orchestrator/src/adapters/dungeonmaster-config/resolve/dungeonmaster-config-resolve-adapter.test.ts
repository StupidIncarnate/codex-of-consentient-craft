import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { dungeonmasterConfigResolveAdapter } from './dungeonmaster-config-resolve-adapter';
import { dungeonmasterConfigResolveAdapterProxy } from './dungeonmaster-config-resolve-adapter.proxy';

describe('dungeonmasterConfigResolveAdapter', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(dungeonmasterConfigResolveAdapter).toStrictEqual(expect.any(Function));
    });
  });

  describe('resolves config', () => {
    it('VALID: {startPath} => returns resolved config', async () => {
      const proxy = dungeonmasterConfigResolveAdapterProxy();
      const config = proxy.makeRealConfig();
      proxy.setupConfigResolved({ config });

      const result = await dungeonmasterConfigResolveAdapter({
        startPath: FilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(config);
    });
  });

  describe('error handling', () => {
    it('ERROR: {config resolve fails} => throws', async () => {
      const proxy = dungeonmasterConfigResolveAdapterProxy();
      proxy.setupConfigResolveError({ error: new Error('Config not found') });

      await expect(
        dungeonmasterConfigResolveAdapter({
          startPath: FilePathStub({ value: '/project' }),
        }),
      ).rejects.toThrow(/Config not found/u);
    });
  });
});
