import {
  AbsoluteFilePathStub,
  QuestIdStub,
  QuestStub,
  RepoRootCwdStub,
} from '@dungeonmaster/shared/contracts';

import { questCwdResolveBroker } from './quest-cwd-resolve-broker';
import { questCwdResolveBrokerProxy } from './quest-cwd-resolve-broker.proxy';

describe('questCwdResolveBroker', () => {
  it('VALID: {quest has worktreePath, directory accessible} => returns the worktree cwd', async () => {
    const proxy = questCwdResolveBrokerProxy();
    const quest = QuestStub({
      id: 'add-auth',
      folder: '001-add-auth',
      worktreePath: '/repo/worktrees/add-auth',
    });
    proxy.setupWorktreePresent({ quest });

    const result = await questCwdResolveBroker({ questId: QuestIdStub({ value: quest.id }) });

    expect(result).toStrictEqual({
      kind: 'worktree',
      cwd: RepoRootCwdStub({ value: '/repo/worktrees/add-auth' }),
    });
  });

  it('VALID: {quest has worktreePath, directory missing} => returns missing-worktree carrying the recorded path', async () => {
    const proxy = questCwdResolveBrokerProxy();
    const quest = QuestStub({
      id: 'add-auth',
      folder: '001-add-auth',
      worktreePath: '/repo/worktrees/add-auth',
    });
    proxy.setupWorktreeMissing({ quest });

    const result = await questCwdResolveBroker({ questId: QuestIdStub({ value: quest.id }) });

    expect(result).toStrictEqual({
      kind: 'missing-worktree',
      worktreePath: AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth' }),
    });
  });

  it('VALID: {quest has no worktreePath} => falls back to the repo root that owns the quest guild', async () => {
    const proxy = questCwdResolveBrokerProxy();
    const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
    const repoRoot = RepoRootCwdStub({ value: '/resolved/repo/root' });
    proxy.setupLegacyQuest({ quest, repoRoot });

    const result = await questCwdResolveBroker({ questId: QuestIdStub({ value: quest.id }) });

    expect(result).toStrictEqual({ kind: 'repo-root', cwd: repoRoot });
  });

  it('ERROR: {quest does not exist} => throws naming the quest id', async () => {
    const proxy = questCwdResolveBrokerProxy();
    proxy.setupQuestNotFound();

    await expect(
      questCwdResolveBroker({ questId: QuestIdStub({ value: 'ghost-quest' }) }),
    ).rejects.toThrow(/Quest not found: ghost-quest/u);
  });
});
