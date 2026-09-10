import {
  AbsoluteFilePathStub,
  QuestIdStub,
  QuestSessionStub,
  QuestStub,
  RepoRootCwdStub,
  SessionIdStub,
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

  it('VALID: {sessionId with a recorded row} => returns that row cwd under kind session', async () => {
    const proxy = questCwdResolveBrokerProxy();
    const quest = QuestStub({
      id: 'add-auth',
      folder: '001-add-auth',
      sessions: [
        QuestSessionStub({
          sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
          cwd: '/repo',
          role: 'chaoswhisperer',
        }),
      ],
    });
    proxy.setupSessionRow({ quest });

    const result = await questCwdResolveBroker({
      questId: QuestIdStub({ value: quest.id }),
      sessionId: SessionIdStub({ value: 'e0047cb8-02a2-448f-a1cb-909c9681f999' }),
    });

    expect(result).toStrictEqual({ kind: 'session', cwd: RepoRootCwdStub({ value: '/repo' }) });
  });

  it('VALID: {recorded row AND a worktreePath} => returns the row, not the worktree', async () => {
    const proxy = questCwdResolveBrokerProxy();
    const quest = QuestStub({
      id: 'add-auth',
      folder: '001-add-auth',
      worktreePath: '/repo/worktrees/add-auth',
      sessions: [
        QuestSessionStub({
          sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
          cwd: '/repo',
          role: 'chaoswhisperer',
        }),
      ],
    });
    proxy.setupSessionRow({ quest });

    const result = await questCwdResolveBroker({
      questId: QuestIdStub({ value: quest.id }),
      sessionId: SessionIdStub({ value: 'e0047cb8-02a2-448f-a1cb-909c9681f999' }),
    });

    expect(result).toStrictEqual({ kind: 'session', cwd: RepoRootCwdStub({ value: '/repo' }) });
  });

  it('VALID: {recorded row, worktree directory missing from disk} => returns the row rather than missing-worktree', async () => {
    const proxy = questCwdResolveBrokerProxy();
    const quest = QuestStub({
      id: 'add-auth',
      folder: '001-add-auth',
      worktreePath: '/repo/worktrees/add-auth',
      sessions: [
        QuestSessionStub({
          sessionId: '8e4e1efe-5619-4d0a-8604-5e92d01423b7',
          cwd: '/repo/worktrees/add-auth',
          role: 'codeweaver',
        }),
      ],
    });
    proxy.setupSessionRow({ quest });

    const result = await questCwdResolveBroker({
      questId: QuestIdStub({ value: quest.id }),
      sessionId: SessionIdStub({ value: '8e4e1efe-5619-4d0a-8604-5e92d01423b7' }),
    });

    expect(result).toStrictEqual({
      kind: 'session',
      cwd: RepoRootCwdStub({ value: '/repo/worktrees/add-auth' }),
    });
  });

  it('VALID: {sessionId with no recorded row} => falls through to the worktree branch', async () => {
    const proxy = questCwdResolveBrokerProxy();
    const quest = QuestStub({
      id: 'add-auth',
      folder: '001-add-auth',
      worktreePath: '/repo/worktrees/add-auth',
      sessions: [
        QuestSessionStub({
          sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
          cwd: '/repo',
          role: 'chaoswhisperer',
        }),
      ],
    });
    proxy.setupWorktreePresent({ quest });

    const result = await questCwdResolveBroker({
      questId: QuestIdStub({ value: quest.id }),
      sessionId: SessionIdStub({ value: '99bba2ad-d227-453c-9e83-3611ca9f240c' }),
    });

    expect(result).toStrictEqual({
      kind: 'worktree',
      cwd: RepoRootCwdStub({ value: '/repo/worktrees/add-auth' }),
    });
  });

  it('ERROR: {quest does not exist} => throws naming the quest id', async () => {
    const proxy = questCwdResolveBrokerProxy();
    proxy.setupQuestNotFound();

    await expect(
      questCwdResolveBroker({ questId: QuestIdStub({ value: 'ghost-quest' }) }),
    ).rejects.toThrow(/Quest not found: ghost-quest/u);
  });
});
