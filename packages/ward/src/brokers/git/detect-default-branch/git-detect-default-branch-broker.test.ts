import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';


import { gitDetectDefaultBranchBroker } from './git-detect-default-branch-broker';
import { gitDetectDefaultBranchBrokerProxy } from './git-detect-default-branch-broker.proxy';

describe('gitDetectDefaultBranchBroker', () => {
  describe('branch detection', () => {
    it('VALID: {repo has main branch} => returns "main"', async () => {
      const proxy = gitDetectDefaultBranchBrokerProxy();
      proxy.setupMainExists();

      const result = await gitDetectDefaultBranchBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe('main');
    });

    it('VALID: {repo has master branch only} => returns "master"', async () => {
      const proxy = gitDetectDefaultBranchBrokerProxy();
      proxy.setupMasterExists();

      const result = await gitDetectDefaultBranchBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe('master');
    });

    it('EMPTY: {repo has neither main nor master} => returns null', async () => {
      const proxy = gitDetectDefaultBranchBrokerProxy();
      proxy.setupNeitherExists();

      const result = await gitDetectDefaultBranchBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe(null);
    });

    // The gateway throws GitNotInstalledError for a missing `git`; the broker folds it into null.
    it('ERROR: {git is not on this machine} => returns null, same as neither branch existing', async () => {
      const proxy = gitDetectDefaultBranchBrokerProxy();
      proxy.setupGitNotFound();

      const result = await gitDetectDefaultBranchBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe(null);
    });
  });
});
