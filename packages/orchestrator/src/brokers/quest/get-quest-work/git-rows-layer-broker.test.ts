import { QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { gitRowsLayerBroker } from './git-rows-layer-broker';
import { gitRowsLayerBrokerProxy } from './git-rows-layer-broker.proxy';

const QUEST_ID = QuestIdStub({ value: 'add-auth' });
const RS = '\u001e';
const US = '\u001f';
const SHA = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';

const CARVED_QUEST = QuestStub({
  id: QUEST_ID,
  worktreePath: '/home/testuser/worktrees/add-auth' as never,
  baseBranch: 'main' as never,
  baseRef: 'a1b2c3d4' as never,
});

describe('gitRowsLayerBroker', () => {
  describe('a reachable worktree', () => {
    it('VALID: {tracked and untracked changes} => uncommittedPaths is the UNION, tracked first', async () => {
      const proxy = gitRowsLayerBrokerProxy();
      proxy.setupWorktreePresent({
        quest: CARVED_QUEST,
        trackedFiles: ['packages/web/src/a.ts'],
        untrackedFiles: ['packages/web/src/b.ts'],
        logOutput: '',
      });

      const rows = await gitRowsLayerBroker({ questId: QUEST_ID, quest: CARVED_QUEST });

      expect(rows.uncommittedPaths).toStrictEqual([
        'packages/web/src/a.ts',
        'packages/web/src/b.ts',
      ]);
    });

    it('VALID: {only an untracked addition} => the net-new file is still reported', async () => {
      const proxy = gitRowsLayerBrokerProxy();
      proxy.setupWorktreePresent({
        quest: CARVED_QUEST,
        trackedFiles: [],
        untrackedFiles: ['packages/web/src/brand-new.ts'],
        logOutput: '',
      });

      const rows = await gitRowsLayerBroker({ questId: QUEST_ID, quest: CARVED_QUEST });

      expect(rows.uncommittedPaths).toStrictEqual(['packages/web/src/brand-new.ts']);
    });

    it('VALID: {one commit since baseRef} => committedPaths carries it with its scope and paths', async () => {
      const proxy = gitRowsLayerBrokerProxy();
      proxy.setupWorktreePresent({
        quest: CARVED_QUEST,
        trackedFiles: [],
        untrackedFiles: [],
        logOutput: `${RS}${SHA}${US}codeweaver: the badge reads off the list${US}work items: pc-badge\n${US}\npackages/web/src/a.ts\n`,
      });

      const rows = await gitRowsLayerBroker({ questId: QUEST_ID, quest: CARVED_QUEST });

      expect(rows.committedPaths).toStrictEqual([
        {
          sha: SHA,
          scope: 'pc-badge',
          subject: 'codeweaver: the badge reads off the list',
          paths: ['packages/web/src/a.ts'],
        },
      ]);
    });

    it('VALID: {a quest with no pinned baseRef} => committedPaths is empty, because there is no range', async () => {
      const quest = QuestStub({ ...CARVED_QUEST, baseRef: undefined });
      const proxy = gitRowsLayerBrokerProxy();
      proxy.setupWorktreePresent({
        quest,
        trackedFiles: [],
        untrackedFiles: [],
        logOutput: '',
      });

      const rows = await gitRowsLayerBroker({ questId: QUEST_ID, quest });

      expect(rows.committedPaths).toStrictEqual([]);
    });
  });

  describe('a worktree that is not reachable', () => {
    it('VALID: {a recorded path that is gone} => both lists are empty rather than a throw', async () => {
      const proxy = gitRowsLayerBrokerProxy();
      proxy.setupWorktreeMissing({ quest: CARVED_QUEST });

      const rows = await gitRowsLayerBroker({ questId: QUEST_ID, quest: CARVED_QUEST });

      expect({
        uncommittedPaths: rows.uncommittedPaths,
        committedPaths: rows.committedPaths,
      }).toStrictEqual({ uncommittedPaths: [], committedPaths: [] });
    });

    it('VALID: {a recorded path that is gone} => the git row still echoes what the record holds', async () => {
      const proxy = gitRowsLayerBrokerProxy();
      proxy.setupWorktreeMissing({ quest: CARVED_QUEST });

      const rows = await gitRowsLayerBroker({ questId: QUEST_ID, quest: CARVED_QUEST });

      expect(rows.git).toStrictEqual({
        baseBranch: 'main',
        worktreePath: '/home/testuser/worktrees/add-auth',
        baseRef: 'a1b2c3d4',
      });
    });

    it('VALID: {a quest that never carved} => every git field is null, never absent', async () => {
      const quest = QuestStub({
        id: QUEST_ID,
        worktreePath: '/home/testuser/worktrees/add-auth' as never,
      });
      const proxy = gitRowsLayerBrokerProxy();
      proxy.setupWorktreeMissing({ quest });

      const rows = await gitRowsLayerBroker({ questId: QUEST_ID, quest });

      expect(rows.git).toStrictEqual({
        baseBranch: null,
        worktreePath: '/home/testuser/worktrees/add-auth',
        baseRef: null,
      });
    });
  });
});
