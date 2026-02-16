import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { GitBranchNameStub } from '../../../contracts/git-branch-name/git-branch-name.stub';

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

      expect(result).toBe(GitBranchNameStub({ value: 'main' }));
    });

    it('VALID: {repo has master branch only} => returns "master"', async () => {
      const proxy = gitDetectDefaultBranchBrokerProxy();
      proxy.setupMasterExists();

      const result = await gitDetectDefaultBranchBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe(GitBranchNameStub({ value: 'master' }));
    });

    it('EMPTY: {repo has neither main nor master} => returns null', async () => {
      const proxy = gitDetectDefaultBranchBrokerProxy();
      proxy.setupNeitherExists();

      const result = await gitDetectDefaultBranchBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBeNull();
    });
  });
});
