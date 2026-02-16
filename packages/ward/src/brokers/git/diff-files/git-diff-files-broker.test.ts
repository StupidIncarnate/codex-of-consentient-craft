import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { GitRelativePathStub } from '../../../contracts/git-relative-path/git-relative-path.stub';

import { gitDiffFilesBroker } from './git-diff-files-broker';
import { gitDiffFilesBrokerProxy } from './git-diff-files-broker.proxy';

describe('gitDiffFilesBroker', () => {
  describe('with main branch', () => {
    it('VALID: {repo has main, merge-base succeeds} => returns changed files via merge-base diff', async () => {
      const proxy = gitDiffFilesBrokerProxy();
      proxy.setupWithMainBranch({ diffOutput: 'src/file1.ts\nsrc/file2.ts\n' });

      const result = await gitDiffFilesBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([
        GitRelativePathStub({ value: 'src/file1.ts' }),
        GitRelativePathStub({ value: 'src/file2.ts' }),
      ]);
    });
  });

  describe('with master branch', () => {
    it('VALID: {repo has master only, merge-base succeeds} => returns changed files', async () => {
      const proxy = gitDiffFilesBrokerProxy();
      proxy.setupWithMasterBranch({ diffOutput: 'src/changed.ts\n' });

      const result = await gitDiffFilesBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([GitRelativePathStub({ value: 'src/changed.ts' })]);
    });
  });

  describe('merge-base failure', () => {
    it('EDGE: {main exists but merge-base fails} => falls back to HEAD diff', async () => {
      const proxy = gitDiffFilesBrokerProxy();
      proxy.setupMergeBaseFails({ diffOutput: 'src/fallback.ts\n' });

      const result = await gitDiffFilesBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([GitRelativePathStub({ value: 'src/fallback.ts' })]);
    });
  });

  describe('no default branch', () => {
    it('EDGE: {neither main nor master exists} => falls back to HEAD diff', async () => {
      const proxy = gitDiffFilesBrokerProxy();
      proxy.setupNoBranch({ diffOutput: 'src/orphan.ts\n' });

      const result = await gitDiffFilesBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([GitRelativePathStub({ value: 'src/orphan.ts' })]);
    });
  });

  describe('empty diff', () => {
    it('EMPTY: {no changed files} => returns empty array', async () => {
      const proxy = gitDiffFilesBrokerProxy();
      proxy.setupWithMainBranch({ diffOutput: '' });

      const result = await gitDiffFilesBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
