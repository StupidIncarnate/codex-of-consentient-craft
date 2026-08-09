import { AbsoluteFilePathStub, BaseBranchNameStub } from '@dungeonmaster/shared/contracts';

import { gitDetectBaseBranchBroker } from './git-detect-base-branch-broker';
import { gitDetectBaseBranchBrokerProxy } from './git-detect-base-branch-broker.proxy';

describe('gitDetectBaseBranchBroker', () => {
  describe('branch detection', () => {
    it('VALID: {repo has main branch} => returns "main" and never probes master', async () => {
      const proxy = gitDetectBaseBranchBrokerProxy();
      proxy.setupMainExists();

      const result = await gitDetectBaseBranchBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe(BaseBranchNameStub({ value: 'main' }));
      expect(proxy.getSpawnedArgsList()).toStrictEqual([['rev-parse', '--verify', 'main']]);
    });

    it('VALID: {repo has master branch only} => returns "master"', async () => {
      const proxy = gitDetectBaseBranchBrokerProxy();
      proxy.setupMasterExists();

      const result = await gitDetectBaseBranchBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe(BaseBranchNameStub({ value: 'master' }));
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['rev-parse', '--verify', 'main'],
        ['rev-parse', '--verify', 'master'],
      ]);
    });

    it('EMPTY: {repo has neither main nor master} => returns null', async () => {
      const proxy = gitDetectBaseBranchBrokerProxy();
      proxy.setupNeitherExists();

      const result = await gitDetectBaseBranchBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe(null);
      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['rev-parse', '--verify', 'main'],
        ['rev-parse', '--verify', 'master'],
      ]);
    });
  });
});
