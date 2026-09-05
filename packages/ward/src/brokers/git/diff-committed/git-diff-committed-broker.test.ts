import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { GitRelativePathStub } from '../../../contracts/git-relative-path/git-relative-path.stub';

import { gitDiffCommittedBroker } from './git-diff-committed-broker';
import { gitDiffCommittedBrokerProxy } from './git-diff-committed-broker.proxy';

describe('gitDiffCommittedBroker', () => {
  describe('origin default branch resolves', () => {
    it('VALID: {origin/main exists, merge-base succeeds} => returns the committed files', async () => {
      const proxy = gitDiffCommittedBrokerProxy();
      proxy.setupWithOriginMain({ diffOutput: 'src/file1.ts\nsrc/file2.ts\n' });

      const result = await gitDiffCommittedBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([
        GitRelativePathStub({ value: 'src/file1.ts' }),
        GitRelativePathStub({ value: 'src/file2.ts' }),
      ]);
    });

    // The second ref is the whole point of this broker: `git diff <base>` with no second ref
    // compares the base to the WORKING TREE, folding uncommitted edits into a set that claims to be
    // about commits. Naming HEAD is what keeps `--committed` and `--uncommitted` disjoint.
    it('VALID: {origin/main exists} => diffs the merge-base against HEAD, not the working tree', async () => {
      const proxy = gitDiffCommittedBrokerProxy();
      proxy.setupWithOriginMain({ diffOutput: 'src/file1.ts\n' });

      await gitDiffCommittedBroker({ cwd: AbsoluteFilePathStub({ value: '/project' }) });

      expect(proxy.getDiffArgs()).toStrictEqual([
        'diff',
        '--name-only',
        '--diff-filter=d',
        'abc123',
        'HEAD',
      ]);
    });

    it('VALID: {origin/main exists} => takes the merge-base against origin/main', async () => {
      const proxy = gitDiffCommittedBrokerProxy();
      proxy.setupWithOriginMain({ diffOutput: 'src/file1.ts\n' });

      await gitDiffCommittedBroker({ cwd: AbsoluteFilePathStub({ value: '/project' }) });

      expect(proxy.getSpawnedArgs()).toStrictEqual([
        ['rev-parse', '--verify', 'origin/main'],
        ['merge-base', 'HEAD', 'origin/main'],
        ['diff', '--name-only', '--diff-filter=d', 'abc123', 'HEAD'],
      ]);
    });

    it('EMPTY: {nothing committed since the base} => returns empty array', async () => {
      const proxy = gitDiffCommittedBrokerProxy();
      proxy.setupWithOriginMain({ diffOutput: '' });

      const result = await gitDiffCommittedBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('repo has no origin refs', () => {
    it('VALID: {no origin refs, local main exists} => measures against the local default branch', async () => {
      const proxy = gitDiffCommittedBrokerProxy();
      proxy.setupWithLocalFallback({ diffOutput: 'src/offline.ts\n' });

      const result = await gitDiffCommittedBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([GitRelativePathStub({ value: 'src/offline.ts' })]);
    });

    it('EMPTY: {no origin refs and no local main or master} => returns empty array', async () => {
      const proxy = gitDiffCommittedBrokerProxy();
      proxy.setupNoBranchAnywhere();

      const result = await gitDiffCommittedBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('merge-base failure', () => {
    // An orphan or force-recreated branch shares no history with the base, so there is no range to
    // diff. Reporting nothing is what makes the caller print the empty-scope message; falling back
    // to a bare `git diff HEAD` would silently answer with `--uncommitted`'s file set instead.
    it('EDGE: {base resolves but shares no history with HEAD} => returns empty array', async () => {
      const proxy = gitDiffCommittedBrokerProxy();
      proxy.setupMergeBaseFails();

      const result = await gitDiffCommittedBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
