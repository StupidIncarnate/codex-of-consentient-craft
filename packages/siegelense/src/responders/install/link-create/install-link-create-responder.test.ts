import {
  AbsoluteFilePathStub,
  FilePathStub,
  InstallContextStub,
} from '@dungeonmaster/shared/contracts';
import { InstallLinkCreateResponderProxy } from './install-link-create-responder.proxy';

const CONTEXT = InstallContextStub({
  value: {
    targetProjectRoot: FilePathStub({ value: '/project' }),
    dungeonmasterRoot: FilePathStub({ value: '/dm-root' }),
  },
});

describe('InstallLinkCreateResponder', () => {
  describe('no link present', () => {
    it('VALID: {no .siegelense link} => creates it pointing at the dungeonmaster siegelense root', async () => {
      const proxy = InstallLinkCreateResponderProxy();
      proxy.setupNoLink();

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'created',
        message: 'Created .siegelense -> /dm-root/siegelense',
      });
      expect(proxy.getSymlinkCalls()).toStrictEqual([
        {
          targetPath: AbsoluteFilePathStub({ value: '/dm-root/siegelense' }),
          linkPath: AbsoluteFilePathStub({ value: '/project/.siegelense' }),
          type: 'dir',
        },
      ]);
    });

    it('VALID: {no .siegelense link} => creates the target directory before creating the link', async () => {
      const proxy = InstallLinkCreateResponderProxy();
      proxy.setupNoLink();

      await proxy.callResponder({ context: CONTEXT });

      expect(proxy.assertMkdirCalledBeforeSymlink()).toBe(true);
    });
  });

  describe('link already points at the right target', () => {
    it('VALID: {.siegelense already points at the dungeonmaster siegelense root} => makes no symlink call', async () => {
      const proxy = InstallLinkCreateResponderProxy();
      proxy.setupCorrectLink();

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message: '.siegelense already points at /dm-root/siegelense',
      });
      expect(proxy.getSymlinkCalls()).toStrictEqual([]);
      expect(proxy.getReadlinkCalls()).toStrictEqual([
        AbsoluteFilePathStub({ value: '/project/.siegelense' }),
      ]);
    });
  });

  describe('link points at a different target', () => {
    it('EDGE: {.siegelense left over from another checkout} => unlinks it and creates one at the right target', async () => {
      const proxy = InstallLinkCreateResponderProxy();
      proxy.setupWrongTarget({ wrongTarget: '/other/checkout/.dungeonmaster/siegelense' });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'created',
        message: 'Replaced .siegelense to point at /dm-root/siegelense',
      });
      expect(proxy.getUnlinkedPaths()).toStrictEqual([
        AbsoluteFilePathStub({ value: '/project/.siegelense' }),
      ]);
      expect(proxy.getSymlinkCalls()).toStrictEqual([
        {
          targetPath: AbsoluteFilePathStub({ value: '/dm-root/siegelense' }),
          linkPath: AbsoluteFilePathStub({ value: '/project/.siegelense' }),
          type: 'dir',
        },
      ]);
    });
  });
});
