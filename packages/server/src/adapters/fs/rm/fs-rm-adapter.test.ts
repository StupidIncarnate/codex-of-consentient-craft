import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { fsRmAdapter } from './fs-rm-adapter';
import { fsRmAdapterProxy } from './fs-rm-adapter.proxy';

describe('fsRmAdapter', () => {
  describe('successful removal', () => {
    it('VALID: {filePath, recursive: true, force: true} => removes directory and returns success', async () => {
      const filePath = AbsoluteFilePathStub({ value: '/tmp/quest-new-responder-test/quests/abc' });
      const proxy = fsRmAdapterProxy();
      proxy.succeeds({ filePath });

      await expect(fsRmAdapter({ filePath, recursive: true, force: true })).resolves.toStrictEqual({
        success: true,
      });
      expect(proxy.getOptionsFor({ filePath })).toStrictEqual({ recursive: true, force: true });
    });

    it('VALID: {filePath only} => removes file and returns success', async () => {
      const filePath = AbsoluteFilePathStub({ value: '/tmp/quest-new-responder-test/file.json' });
      const proxy = fsRmAdapterProxy();
      proxy.succeeds({ filePath });

      await expect(fsRmAdapter({ filePath })).resolves.toStrictEqual({ success: true });
      expect(proxy.getOptionsFor({ filePath })).toStrictEqual({
        recursive: undefined,
        force: undefined,
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {rm fails} => throws error', async () => {
      const filePath = AbsoluteFilePathStub({ value: '/tmp/quest-new-responder-test/nonexistent' });
      const proxy = fsRmAdapterProxy();
      proxy.throws({ filePath, error: new Error('EACCES: permission denied') });

      await expect(fsRmAdapter({ filePath })).rejects.toThrow(/EACCES/u);
    });
  });
});
