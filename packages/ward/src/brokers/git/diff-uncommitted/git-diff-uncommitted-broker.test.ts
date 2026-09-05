import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { GitRelativePathStub } from '../../../contracts/git-relative-path/git-relative-path.stub';

import { gitDiffUncommittedBroker } from './git-diff-uncommitted-broker';
import { gitDiffUncommittedBrokerProxy } from './git-diff-uncommitted-broker.proxy';

describe('gitDiffUncommittedBroker', () => {
  describe('tracked edits and untracked additions together', () => {
    it('VALID: {one edited file, one brand-new file} => returns both, tracked first', async () => {
      const proxy = gitDiffUncommittedBrokerProxy();
      proxy.setupWorkingTree({
        trackedOutput: 'packages/ward/src/edited.ts\n',
        untrackedOutput: 'packages/ward/src/brand-new.ts\n',
      });

      const result = await gitDiffUncommittedBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([
        GitRelativePathStub({ value: 'packages/ward/src/edited.ts' }),
        GitRelativePathStub({ value: 'packages/ward/src/brand-new.ts' }),
      ]);
    });

    // THE DEFECT THIS BROKER EXISTS TO CLOSE. `git diff` in every form reports tracked paths only,
    // so a pass whose files are all new produced a green gate over an empty set. Measured on quest
    // 1be07040: a 99-file pass was graded on 6 files, and both defects that later went red came out
    // of that commit.
    it('VALID: {nothing tracked has changed, three new files} => returns all three new files', async () => {
      const proxy = gitDiffUncommittedBrokerProxy();
      proxy.setupWorkingTree({
        trackedOutput: '',
        untrackedOutput: 'a/one.ts\na/two.ts\nb/three.ts\n',
      });

      const result = await gitDiffUncommittedBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([
        GitRelativePathStub({ value: 'a/one.ts' }),
        GitRelativePathStub({ value: 'a/two.ts' }),
        GitRelativePathStub({ value: 'b/three.ts' }),
      ]);
    });
  });

  describe('the two readings git is asked for', () => {
    it('VALID: {any working tree} => diffs against HEAD and lists untracked files excluding ignored ones', async () => {
      const proxy = gitDiffUncommittedBrokerProxy();
      proxy.setupWorkingTree({ trackedOutput: 'x.ts\n', untrackedOutput: '' });

      await gitDiffUncommittedBroker({ cwd: AbsoluteFilePathStub({ value: '/project' }) });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        ['diff', '--name-only', '--diff-filter=d', 'HEAD'],
        ['ls-files', '--others', '--exclude-standard'],
      ]);
    });
  });

  describe('a path in both readings', () => {
    // `git add -N` (intent-to-add) puts one path in the diff AND in the untracked list. A check
    // runner handed the same path twice reports it twice.
    it('EDGE: {an intent-to-add path in both readings} => appears once, at its first position', async () => {
      const proxy = gitDiffUncommittedBrokerProxy();
      proxy.setupWorkingTree({
        trackedOutput: 'shared.ts\nedited.ts\n',
        untrackedOutput: 'shared.ts\nnew.ts\n',
      });

      const result = await gitDiffUncommittedBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([
        GitRelativePathStub({ value: 'shared.ts' }),
        GitRelativePathStub({ value: 'edited.ts' }),
        GitRelativePathStub({ value: 'new.ts' }),
      ]);
    });
  });

  describe('clean working tree', () => {
    it('EMPTY: {nothing edited and nothing new} => returns empty array', async () => {
      const proxy = gitDiffUncommittedBrokerProxy();
      proxy.setupWorkingTree({ trackedOutput: '', untrackedOutput: '' });

      const result = await gitDiffUncommittedBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
