import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { fsMkdirAdapter } from './fs-mkdir-adapter';
import { fsMkdirAdapterProxy } from './fs-mkdir-adapter.proxy';

describe('fsMkdirAdapter', () => {
  describe('successful create', () => {
    it('VALID: {dirPath} => creates without throwing and calls mkdir with { recursive: true }', async () => {
      const dirPath = AbsoluteFilePathStub({ value: '/tmp/quest/images' });
      const proxy = fsMkdirAdapterProxy();
      proxy.succeeds({ dirPath });

      await expect(fsMkdirAdapter({ dirPath })).resolves.toStrictEqual({
        success: true,
      });
      expect(proxy.getOptionsFor({ dirPath })).toStrictEqual({ recursive: true });
    });
  });

  describe('error cases', () => {
    it('ERROR: {mkdir fails} => throws error', async () => {
      const dirPath = AbsoluteFilePathStub({ value: '/tmp/quest/images' });
      const proxy = fsMkdirAdapterProxy();
      proxy.throws({ dirPath, error: new Error('EACCES: permission denied') });

      await expect(fsMkdirAdapter({ dirPath })).rejects.toThrow(/EACCES/u);
    });
  });
});
