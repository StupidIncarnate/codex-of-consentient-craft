import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { GitBranchNameStub } from '../../../contracts/git-branch-name/git-branch-name.stub';

import { gitDetectUpstreamBroker } from './git-detect-upstream-broker';
import { gitDetectUpstreamBrokerProxy } from './git-detect-upstream-broker.proxy';

describe('gitDetectUpstreamBroker', () => {
  describe('branch has a tracking branch', () => {
    it('VALID: {@{upstream} resolves to origin/master} => returns that ref', async () => {
      const proxy = gitDetectUpstreamBrokerProxy();
      proxy.setupTrackingBranch({ upstreamRef: 'origin/master' });

      const result = await gitDetectUpstreamBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(GitBranchNameStub({ value: 'origin/master' }));
    });

    it('VALID: {@{upstream} resolves to a non-default branch} => returns that branch, not origin/main', async () => {
      const proxy = gitDetectUpstreamBrokerProxy();
      proxy.setupTrackingBranch({ upstreamRef: 'origin/refactor/planner' });

      const result = await gitDetectUpstreamBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(GitBranchNameStub({ value: 'origin/refactor/planner' }));
    });

    it('VALID: {tracking branch exists} => asks git for the symbolic upstream name only once', async () => {
      const proxy = gitDetectUpstreamBrokerProxy();
      proxy.setupTrackingBranch({ upstreamRef: 'origin/master' });

      await gitDetectUpstreamBroker({ cwd: AbsoluteFilePathStub({ value: '/project' }) });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'],
      ]);
    });
  });

  describe('branch has no tracking branch', () => {
    it('VALID: {no upstream, origin/main exists} => falls back to origin/main', async () => {
      const proxy = gitDetectUpstreamBrokerProxy();
      proxy.setupNoTrackingBranchOriginMainExists();

      const result = await gitDetectUpstreamBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(GitBranchNameStub({ value: 'origin/main' }));
    });

    it('VALID: {no upstream, only origin/master exists} => falls back to origin/master', async () => {
      const proxy = gitDetectUpstreamBrokerProxy();
      proxy.setupNoTrackingBranchOriginMasterExists();

      const result = await gitDetectUpstreamBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(GitBranchNameStub({ value: 'origin/master' }));
    });

    it('VALID: {no upstream} => verifies origin/main before origin/master', async () => {
      const proxy = gitDetectUpstreamBrokerProxy();
      proxy.setupNoTrackingBranchOriginMasterExists();

      await gitDetectUpstreamBroker({ cwd: AbsoluteFilePathStub({ value: '/project' }) });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'],
        ['rev-parse', '--verify', 'origin/main'],
        ['rev-parse', '--verify', 'origin/master'],
      ]);
    });
  });

  describe('repo has no origin refs', () => {
    it('EMPTY: {no upstream, no origin/main, no origin/master} => returns null', async () => {
      const proxy = gitDetectUpstreamBrokerProxy();
      proxy.setupNoOriginRefs();

      const result = await gitDetectUpstreamBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe(null);
    });
  });

  describe('upstream command succeeds but prints nothing', () => {
    it('EDGE: {rev-parse exits 0 with empty output} => falls back to origin/main', async () => {
      const proxy = gitDetectUpstreamBrokerProxy();
      proxy.setupEmptyTrackingBranchOriginMainExists();

      const result = await gitDetectUpstreamBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(GitBranchNameStub({ value: 'origin/main' }));
    });
  });
});
