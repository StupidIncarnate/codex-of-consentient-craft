import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { GitRelativePathStub } from '../../../contracts/git-relative-path/git-relative-path.stub';

import { gitDiffUnpushedBroker } from './git-diff-unpushed-broker';
import { gitDiffUnpushedBrokerProxy } from './git-diff-unpushed-broker.proxy';

describe('gitDiffUnpushedBroker', () => {
  describe('branch tracks a remote branch', () => {
    it('VALID: {two files touched by unpushed commits} => returns both paths', async () => {
      const proxy = gitDiffUnpushedBrokerProxy();
      proxy.setupWithTrackingBranch({
        upstreamRef: 'origin/master',
        diffOutput: 'packages/ward/src/a.ts\npackages/ward/src/b.ts\n',
      });

      const result = await gitDiffUnpushedBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([
        GitRelativePathStub({ value: 'packages/ward/src/a.ts' }),
        GitRelativePathStub({ value: 'packages/ward/src/b.ts' }),
      ]);
    });

    it('VALID: {tracking branch resolves} => diffs from the merge-base against the working tree', async () => {
      const proxy = gitDiffUnpushedBrokerProxy();
      proxy.setupWithTrackingBranch({
        upstreamRef: 'origin/master',
        diffOutput: 'packages/ward/src/a.ts\n',
      });

      await gitDiffUnpushedBroker({ cwd: AbsoluteFilePathStub({ value: '/project' }) });

      expect(proxy.getDiffArgs()).toStrictEqual([
        'diff',
        '--name-only',
        '--diff-filter=d',
        'abc123',
      ]);
    });

    it('EMPTY: {nothing unpushed and a clean working tree} => returns empty array', async () => {
      const proxy = gitDiffUnpushedBrokerProxy();
      proxy.setupWithTrackingBranch({ upstreamRef: 'origin/master', diffOutput: '' });

      const result = await gitDiffUnpushedBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('branch has never been pushed', () => {
    it('VALID: {no tracking branch, origin/main exists} => returns files diffed from origin/main', async () => {
      const proxy = gitDiffUnpushedBrokerProxy();
      proxy.setupWithoutTrackingBranch({ diffOutput: 'packages/ward/src/new.ts\n' });

      const result = await gitDiffUnpushedBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([GitRelativePathStub({ value: 'packages/ward/src/new.ts' })]);
    });
  });

  describe('merge-base failure', () => {
    it('EDGE: {upstream resolves but shares no history with HEAD} => falls back to the local default-branch diff', async () => {
      const proxy = gitDiffUnpushedBrokerProxy();
      proxy.setupMergeBaseFails({ diffOutput: 'packages/ward/src/fallback.ts\n' });

      const result = await gitDiffUnpushedBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([
        GitRelativePathStub({ value: 'packages/ward/src/fallback.ts' }),
      ]);
    });
  });

  describe('repo has no origin refs', () => {
    it('EDGE: {no upstream and no origin branches} => falls back to the local default-branch diff', async () => {
      const proxy = gitDiffUnpushedBrokerProxy();
      proxy.setupNoOriginRefs({ diffOutput: 'packages/ward/src/orphan.ts\n' });

      const result = await gitDiffUnpushedBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([GitRelativePathStub({ value: 'packages/ward/src/orphan.ts' })]);
    });
  });
});
