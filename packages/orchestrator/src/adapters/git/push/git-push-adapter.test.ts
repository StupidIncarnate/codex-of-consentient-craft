import { AbsoluteFilePathStub, QuestBranchNameStub } from '@dungeonmaster/shared/contracts';

import { gitPushAdapter } from './git-push-adapter';
import { gitPushAdapterProxy } from './git-push-adapter.proxy';

const CWD = AbsoluteFilePathStub({ value: '/home/testuser/worktrees/add-auth' });

describe('gitPushAdapter', () => {
  describe('the bare push', () => {
    it('VALID: {no setUpstream} => spawns `git push` with no remote or branch to get wrong', async () => {
      const proxy = gitPushAdapterProxy();
      proxy.setupSuccess();

      await gitPushAdapter({ cwd: CWD });

      expect(proxy.getSpawnedArgs()).toStrictEqual(['push']);
    });

    it('VALID: {push succeeds} => returns exit code 0', async () => {
      const proxy = gitPushAdapterProxy();
      proxy.setupSuccess();

      const result = await gitPushAdapter({ cwd: CWD });

      expect(result.exitCode).toBe(0);
    });

    it('VALID: {cwd} => pushes from that checkout, not the process cwd', async () => {
      const proxy = gitPushAdapterProxy();
      proxy.setupSuccess();

      await gitPushAdapter({ cwd: CWD });

      expect(proxy.getSpawnedCwd()).toBe('/home/testuser/worktrees/add-auth');
    });
  });

  describe('the first push, which establishes the upstream', () => {
    // Riftcarver makes this call once while carving, which is what leaves every later push able to
    // be the bare form — and what makes `@{upstream}..HEAD` resolvable for the rest of the quest.
    it('VALID: {setUpstream} => spawns `git push -u origin <branch>`', async () => {
      const proxy = gitPushAdapterProxy();
      proxy.setupSuccess();

      await gitPushAdapter({
        cwd: CWD,
        setUpstream: { branchName: QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' }) },
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        'push',
        '-u',
        'origin',
        'quest/add-auth-7bc217a1',
      ]);
    });
  });

  describe('failure', () => {
    // It reports rather than throws: a failed push leaves every commit intact in the worktree, so
    // the caller decides whether that is fatal. For riftcarver it is a repairable step; for the
    // signal path it is a durability miss that must not block the quest.
    it('ERROR: {git exits non-zero} => returns the exit code and git output rather than throwing', async () => {
      const proxy = gitPushAdapterProxy();
      proxy.setupFailure({ output: 'fatal: Authentication failed' });

      const result = await gitPushAdapter({ cwd: CWD });

      expect({ exitCode: result.exitCode, output: String(result.output) }).toStrictEqual({
        exitCode: 128,
        output: 'fatal: Authentication failed',
      });
    });
  });
});
