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
      const startPath = FilePathStub({ value: '/project' });
      const config = proxy.makeRealConfig();
      proxy.setupConfigResolved({ startPath, config });

      const result = await dungeonmasterConfigResolveAdapter({ startPath });

      expect(result).toStrictEqual(config);
    });
  });

  describe('error handling', () => {
    it('ERROR: {config resolve fails} => throws', async () => {
      const proxy = dungeonmasterConfigResolveAdapterProxy();
      const startPath = FilePathStub({ value: '/project' });
      proxy.setupConfigResolveError({ startPath, error: new Error('Config not found') });

      await expect(dungeonmasterConfigResolveAdapter({ startPath })).rejects.toThrow(
        /Config not found/u,
      );
    });
  });
});
