import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { gitAddAllAdapter } from './git-add-all-adapter';
import { gitAddAllAdapterProxy } from './git-add-all-adapter.proxy';

const CWD = AbsoluteFilePathStub({ value: '/home/testuser/worktrees/add-auth' });

describe('gitAddAllAdapter', () => {
  describe('success', () => {
    it('VALID: {cwd} => spawns `git add -A` from that checkout', async () => {
      const proxy = gitAddAllAdapterProxy();
      proxy.setupSuccess();

      await gitAddAllAdapter({ cwd: CWD });

      expect({ args: proxy.getSpawnedArgs(), cwd: proxy.getSpawnedCwd() }).toStrictEqual({
        args: ['add', '-A'],
        cwd: '/home/testuser/worktrees/add-auth',
      });
    });

    it('VALID: {git add succeeds} => returns exit code 0', async () => {
      const proxy = gitAddAllAdapterProxy();
      proxy.setupSuccess();

      const result = await gitAddAllAdapter({ cwd: CWD });

      expect(result.exitCode).toBe(0);
    });
  });

  describe('failure', () => {
    it('ERROR: {git exits non-zero} => returns the exit code and output rather than throwing', async () => {
      const proxy = gitAddAllAdapterProxy();
      proxy.setupFailure({ output: 'fatal: not a git repository' });

      const result = await gitAddAllAdapter({ cwd: CWD });

      expect({ exitCode: result.exitCode, output: String(result.output) }).toStrictEqual({
        exitCode: 128,
        output: 'fatal: not a git repository',
      });
    });
  });
});
