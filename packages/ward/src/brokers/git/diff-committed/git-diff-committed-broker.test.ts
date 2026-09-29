import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';

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

    // The range ends at HEAD, which is the whole point of this broker: a diff with no second ref
    // compares the base to the WORKING TREE, folding uncommitted edits into a set that claims to be
    // about commits. Naming HEAD is what keeps `--committed` and `--uncommitted` disjoint.
    it('VALID: {origin/main exists} => diffs the merge-base against HEAD, not the working tree', async () => {
      const proxy = gitDiffCommittedBrokerProxy();
      proxy.setupWithOriginMain({ diffOutput: 'src/file1.ts\n' });

      await gitDiffCommittedBroker({ cwd: AbsoluteFilePathStub({ value: '/project' }) });

      expect(proxy.getDiffCalls()).toStrictEqual([
        [
          {
            command: 'git',
            args: ['diff', 'abc123...HEAD', '--name-only', '--diff-filter=d'],
            cwd: '/project',
          },
        ],
      ]);
    });

    it('VALID: {origin/main exists} => takes the merge-base against origin/main after verifying it', async () => {
      const proxy = gitDiffCommittedBrokerProxy();
      proxy.setupWithOriginMain({ diffOutput: 'src/file1.ts\n' });

      await gitDiffCommittedBroker({ cwd: AbsoluteFilePathStub({ value: '/project' }) });

      expect({
        revParse: proxy.getOriginRevParseCalls(),
        mergeBase: proxy.getMergeBaseCalls({ baseBranch: 'origin/main' }),
      }).toStrictEqual({
        revParse: [
          [{ command: 'git', args: ['rev-parse', '--verify', 'origin/main'], cwd: '/project' }],
        ],
        mergeBase: [
          [{ command: 'git', args: ['merge-base', 'HEAD', 'origin/main'], cwd: '/project' }],
        ],
      });
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

  describe('git is not on this machine', () => {
    // Both detection brokers fold the gateway's GitNotInstalledError into null, so the base branch
    // resolves to null before merge-base is ever run.
    it('ERROR: {git is not on this machine} => returns empty array, same as no branch existing anywhere', async () => {
      const proxy = gitDiffCommittedBrokerProxy();
      proxy.setupGitNotFound();

      const result = await gitDiffCommittedBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([]);
    });

    // git vanishes after the base branch resolved: the merge-base call is what cannot start.
    it('ERROR: {git cannot start at merge-base} => returns empty array', async () => {
      const proxy = gitDiffCommittedBrokerProxy();
      proxy.setupGitNotFoundAtMergeBase();

      const result = await gitDiffCommittedBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
