import { ServerInitResponderProxy } from './server-init-responder.proxy';
import { discoverIgnoreState } from '../../../state/discover-ignore/discover-ignore-state';
import { FileContentsStub, GlobPatternStub } from '@dungeonmaster/shared/contracts';

describe('ServerInitResponder', () => {
  describe('successful initialization', () => {
    it('VALID: {default state} => completes initialization without error', async () => {
      const proxy = ServerInitResponderProxy();

      proxy.setupNoGitignore();

      await expect(proxy.callResponder()).resolves.toStrictEqual({ success: true });
    });
  });

  describe('discover ignore list', () => {
    it('VALID: {.gitignore naming tmp and worktrees} => state carries the merged list', async () => {
      const proxy = ServerInitResponderProxy();

      proxy.setupGitignore({ contents: FileContentsStub({ value: 'tmp\nworktrees/\n' }) });

      await proxy.callResponder();

      expect(discoverIgnoreState.get()).toStrictEqual([
        GlobPatternStub({ value: '**/node_modules/**' }),
        GlobPatternStub({ value: '**/dist/**' }),
        GlobPatternStub({ value: '**/build/**' }),
        GlobPatternStub({ value: '**/.git/**' }),
        GlobPatternStub({ value: '**/tmp' }),
        GlobPatternStub({ value: '**/tmp/**' }),
        GlobPatternStub({ value: '**/worktrees/**' }),
      ]);
    });

    it('EMPTY: {no .gitignore on disk} => state carries the static rules alone', async () => {
      const proxy = ServerInitResponderProxy();

      proxy.setupNoGitignore();

      await proxy.callResponder();

      expect(discoverIgnoreState.get()).toStrictEqual([
        GlobPatternStub({ value: '**/node_modules/**' }),
        GlobPatternStub({ value: '**/dist/**' }),
        GlobPatternStub({ value: '**/build/**' }),
        GlobPatternStub({ value: '**/.git/**' }),
      ]);
    });
  });
});
