import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { gitCommitAdapter } from './git-commit-adapter';
import { gitCommitAdapterProxy } from './git-commit-adapter.proxy';

const CWD = AbsoluteFilePathStub({ value: '/home/testuser/worktrees/add-auth' });

describe('gitCommitAdapter', () => {
  describe('a bare commit', () => {
    it('VALID: {message, no allowEmpty} => spawns `git commit -m <message>` with no --allow-empty', async () => {
      const proxy = gitCommitAdapterProxy();
      proxy.setupSuccess();

      await gitCommitAdapter({ cwd: CWD, message: 'codeweaver/work: add auth' });

      expect(proxy.getSpawnedArgs()).toStrictEqual(['commit', '-m', 'codeweaver/work: add auth']);
    });

    it('VALID: {cwd} => commits from that checkout, not the process cwd', async () => {
      const proxy = gitCommitAdapterProxy();
      proxy.setupSuccess();

      await gitCommitAdapter({ cwd: CWD, message: 'codeweaver/work: add auth' });

      expect(proxy.getSpawnedCwd()).toBe('/home/testuser/worktrees/add-auth');
    });
  });

  describe('allowEmpty: true', () => {
    it('VALID: {allowEmpty: true} => spawns with --allow-empty appended', async () => {
      const proxy = gitCommitAdapterProxy();
      proxy.setupSuccess();

      await gitCommitAdapter({
        cwd: CWD,
        message: 'ward/commit: repair',
        allowEmpty: true,
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        'commit',
        '-m',
        'ward/commit: repair',
        '--allow-empty',
      ]);
    });
  });

  describe('failure', () => {
    it('ERROR: {git exits non-zero} => returns the exit code and output rather than throwing', async () => {
      const proxy = gitCommitAdapterProxy();
      proxy.setupFailure({ output: 'fatal: not a git repository' });

      const result = await gitCommitAdapter({ cwd: CWD, message: 'x' });

      expect({ exitCode: result.exitCode, output: String(result.output) }).toStrictEqual({
        exitCode: 1,
        output: 'fatal: not a git repository',
      });
    });
  });
});
