import { AbsoluteFilePathStub, RepoRelativePathStub } from '@dungeonmaster/shared/contracts';

import { gitWorkingTreeFilesBroker } from './git-working-tree-files-broker';
import { gitWorkingTreeFilesBrokerProxy } from './git-working-tree-files-broker.proxy';

describe('gitWorkingTreeFilesBroker', () => {
  describe('the union of both readings', () => {
    // THE regression guard for this broker's reason to exist: `git diff` reports tracked paths
    // only, so a net-new file is in neither the range form nor the working-tree form. If the
    // untracked half is ever dropped, this is the assertion that goes red instead of a reviewer
    // silently returning green on files it never opened.
    it('VALID: {one tracked modification, one net-new untracked file} => both appear, tracked first', async () => {
      const proxy = gitWorkingTreeFilesBrokerProxy();
      proxy.setupWorkingTree({
        trackedFiles: ['packages/orchestrator/src/brokers/foo/foo-broker.ts'],
        untrackedFiles: ['packages/orchestrator/src/brokers/brand-new/brand-new-broker.ts'],
      });

      const result = await gitWorkingTreeFilesBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([
        RepoRelativePathStub({ value: 'packages/orchestrator/src/brokers/foo/foo-broker.ts' }),
        RepoRelativePathStub({
          value: 'packages/orchestrator/src/brokers/brand-new/brand-new-broker.ts',
        }),
      ]);
    });

    it('VALID: {only untracked files, empty diff} => returns them, because an empty diff is not an empty working tree', async () => {
      const proxy = gitWorkingTreeFilesBrokerProxy();
      proxy.setupWorkingTree({
        trackedFiles: [],
        untrackedFiles: [
          'packages/orchestrator/src/statics/new-thing/new-thing-statics.ts',
          'packages/orchestrator/src/statics/new-thing/new-thing-statics.test.ts',
        ],
      });

      const result = await gitWorkingTreeFilesBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([
        RepoRelativePathStub({
          value: 'packages/orchestrator/src/statics/new-thing/new-thing-statics.ts',
        }),
        RepoRelativePathStub({
          value: 'packages/orchestrator/src/statics/new-thing/new-thing-statics.test.ts',
        }),
      ]);
    });

    it('VALID: {a path reported by both readings} => appears once, on its first appearance', async () => {
      const proxy = gitWorkingTreeFilesBrokerProxy();
      proxy.setupWorkingTree({
        trackedFiles: [
          'packages/orchestrator/src/brokers/foo/foo-broker.ts',
          'packages/orchestrator/src/brokers/bar/bar-broker.ts',
        ],
        untrackedFiles: ['packages/orchestrator/src/brokers/foo/foo-broker.ts'],
      });

      const result = await gitWorkingTreeFilesBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([
        RepoRelativePathStub({ value: 'packages/orchestrator/src/brokers/foo/foo-broker.ts' }),
        RepoRelativePathStub({ value: 'packages/orchestrator/src/brokers/bar/bar-broker.ts' }),
      ]);
    });
  });

  describe('empty working tree', () => {
    it('EMPTY: {nothing changed and nothing new} => returns []', async () => {
      const proxy = gitWorkingTreeFilesBrokerProxy();
      proxy.setupWorkingTree({ trackedFiles: [], untrackedFiles: [] });

      const result = await gitWorkingTreeFilesBroker({
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('spawned git argv', () => {
    // `HEAD...HEAD` is empty by construction, so the tracked half MUST be the rangeless
    // working-tree form. Asserting the exact argv is what stops it silently reverting to the
    // three-dot range this adapter defaults to.
    it('VALID: {cwd} => spawns the rangeless working-tree diff and the excluded-standard ls-files', async () => {
      const proxy = gitWorkingTreeFilesBrokerProxy();
      proxy.setupWorkingTree({ trackedFiles: [], untrackedFiles: [] });

      await gitWorkingTreeFilesBroker({ cwd: AbsoluteFilePathStub({ value: '/project' }) });

      expect(proxy.getSpawnedArgsList()).toStrictEqual([
        ['diff', 'HEAD', '--name-only'],
        ['ls-files', '--others', '--exclude-standard'],
      ]);
    });
  });
});
