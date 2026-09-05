import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { GitBranchNameStub } from '../../../contracts/git-branch-name/git-branch-name.stub';

import { gitDetectOriginDefaultBranchBroker } from './git-detect-origin-default-branch-broker';
import { gitDetectOriginDefaultBranchBrokerProxy } from './git-detect-origin-default-branch-broker.proxy';

describe('gitDetectOriginDefaultBranchBroker', () => {
  describe('origin/main exists', () => {
    it('VALID: {origin/main verifies} => returns origin/main', async () => {
      const proxy = gitDetectOriginDefaultBranchBrokerProxy();
      proxy.setupOriginMainExists();

      const result = await gitDetectOriginDefaultBranchBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(GitBranchNameStub({ value: 'origin/main' }));
    });

    it('VALID: {origin/main verifies} => never asks git about origin/master', async () => {
      const proxy = gitDetectOriginDefaultBranchBrokerProxy();
      proxy.setupOriginMainExists();

      await gitDetectOriginDefaultBranchBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual([['rev-parse', '--verify', 'origin/main']]);
    });
  });

  describe('only origin/master exists', () => {
    it('VALID: {origin/main missing, origin/master verifies} => returns origin/master', async () => {
      const proxy = gitDetectOriginDefaultBranchBrokerProxy();
      proxy.setupOriginMasterExists();

      const result = await gitDetectOriginDefaultBranchBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual(GitBranchNameStub({ value: 'origin/master' }));
    });

    // Pinning the WHOLE arg list also proves the branch's own `@{upstream}` is never consulted. A
    // pushed branch's upstream is its own remote copy, so measuring against it would collapse the
    // committed diff to nothing the moment a reviewer pushes — the shrinking-window defect this
    // broker was rewritten to remove.
    it('VALID: {origin/main missing} => verifies origin/main, then origin/master, and nothing else', async () => {
      const proxy = gitDetectOriginDefaultBranchBrokerProxy();
      proxy.setupOriginMasterExists();

      await gitDetectOriginDefaultBranchBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        ['rev-parse', '--verify', 'origin/main'],
        ['rev-parse', '--verify', 'origin/master'],
      ]);
    });
  });

  describe('repo has no origin refs', () => {
    it('EMPTY: {neither origin/main nor origin/master} => returns null', async () => {
      const proxy = gitDetectOriginDefaultBranchBrokerProxy();
      proxy.setupNoOriginRefs();

      const result = await gitDetectOriginDefaultBranchBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe(null);
    });
  });
});
