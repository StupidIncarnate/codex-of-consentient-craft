import {
  AbsoluteFilePathStub,
  FilePathStub,
  InstallContextStub,
} from '@dungeonmaster/shared/contracts';
import { InstallLinkCreateResponderProxy } from './install-link-create-responder.proxy';

// dungeonmasterRoot is deliberately NOT the siegelense root — it names the CLI package's own
// install location (see cli-entry.ts), which the responder no longer reads at all. Every
// assertion below pins the target to TARGET_DIR_VALUE from the proxy (resolved through
// locationsRootPathFindBrokerProxy), proving the responder ignores this field.
const CONTEXT = InstallContextStub({
  value: {
    targetProjectRoot: FilePathStub({ value: '/project' }),
    dungeonmasterRoot: FilePathStub({ value: '/wrong-cli-install-root' }),
  },
});

describe('InstallLinkCreateResponder', () => {
  describe('no link present', () => {
    it('VALID: {no siegelense-assets link} => creates it pointing at the dungeonmaster siegelense root', async () => {
      const proxy = InstallLinkCreateResponderProxy();
      proxy.setupNoLink();

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'created',
        message:
          'Created .dungeonmaster-assets/siegelense-assets -> /home/user/.dungeonmaster/siegelense',
      });
      expect(proxy.getSymlinkCalls()).toStrictEqual([
        {
          targetPath: AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/siegelense' }),
          linkPath: AbsoluteFilePathStub({
            value: '/project/.dungeonmaster-assets/siegelense-assets',
          }),
          type: 'dir',
        },
      ]);
    });

    it('VALID: {no siegelense-assets link} => creates the siegelense target and the .dungeonmaster-assets parent before creating the link', async () => {
      const proxy = InstallLinkCreateResponderProxy();
      proxy.setupNoLink();

      await proxy.callResponder({ context: CONTEXT });

      expect(proxy.getMkdirCalls()).toStrictEqual([
        FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' }),
        FilePathStub({ value: '/project/.dungeonmaster-assets' }),
      ]);
      expect(proxy.assertMkdirCalledBeforeSymlink()).toBe(true);
    });
  });

  describe('link already points at the right target', () => {
    it('VALID: {siegelense-assets already points at the dungeonmaster siegelense root} => makes no symlink call', async () => {
      const proxy = InstallLinkCreateResponderProxy();
      proxy.setupCorrectLink();

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'skipped',
        message:
          '.dungeonmaster-assets/siegelense-assets already points at /home/user/.dungeonmaster/siegelense',
      });
      expect(proxy.getSymlinkCalls()).toStrictEqual([]);
      expect(proxy.getReadlinkCalls()).toStrictEqual([
        AbsoluteFilePathStub({ value: '/project/.dungeonmaster-assets/siegelense-assets' }),
      ]);
    });
  });

  describe('link points at a different target', () => {
    it('EDGE: {siegelense-assets left over from another checkout} => unlinks it and creates one at the right target', async () => {
      const proxy = InstallLinkCreateResponderProxy();
      proxy.setupWrongTarget({ wrongTarget: '/other/checkout/.dungeonmaster/siegelense' });

      const result = await proxy.callResponder({ context: CONTEXT });

      expect(result).toStrictEqual({
        packageName: '@dungeonmaster/siegelense',
        success: true,
        action: 'created',
        message:
          'Replaced .dungeonmaster-assets/siegelense-assets to point at /home/user/.dungeonmaster/siegelense',
      });
      expect(proxy.getUnlinkedPaths()).toStrictEqual([
        AbsoluteFilePathStub({ value: '/project/.dungeonmaster-assets/siegelense-assets' }),
      ]);
      expect(proxy.getSymlinkCalls()).toStrictEqual([
        {
          targetPath: AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/siegelense' }),
          linkPath: AbsoluteFilePathStub({
            value: '/project/.dungeonmaster-assets/siegelense-assets',
          }),
          type: 'dir',
        },
      ]);
    });
  });
});
