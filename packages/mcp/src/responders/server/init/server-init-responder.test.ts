import { ServerInitResponderProxy } from './server-init-responder.proxy';
import { discoverIgnoreState } from '../../../state/discover-ignore/discover-ignore-state';

describe('ServerInitResponder', () => {
  describe('successful initialization', () => {
    it('VALID: {default state} => completes initialization without error', async () => {
      const proxy = ServerInitResponderProxy();

      proxy.setupNoGitignore();

      await expect(proxy.callResponder()).resolves.toBe(undefined);
    });
  });

  describe('discover ignore list', () => {
    it('VALID: {.gitignore naming tmp and worktrees} => state carries the merged list', async () => {
      const proxy = ServerInitResponderProxy();

      proxy.setupGitignore({ contents: 'tmp\nworktrees/\n' });

      await proxy.callResponder();

      expect(discoverIgnoreState.get()).toStrictEqual([
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**',
        '**/tmp',
        '**/tmp/**',
        '**/worktrees/**',
      ]);
    });

    it('EMPTY: {no .gitignore on disk} => state carries the static rules alone', async () => {
      const proxy = ServerInitResponderProxy();

      proxy.setupNoGitignore();

      await proxy.callResponder();

      expect(discoverIgnoreState.get()).toStrictEqual([
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**',
      ]);
    });
  });
});
