import { QuestIdStub, QuestStub, RepoRootCwdStub } from '@dungeonmaster/shared/contracts';

import { questRepoRootBroker } from './quest-repo-root-broker';
import { questRepoRootBrokerProxy } from './quest-repo-root-broker.proxy';

describe('questRepoRootBroker', () => {
  it('VALID: {cwdResolveBroker resolves} => returns the resolved repo root', async () => {
    const proxy = questRepoRootBrokerProxy();
    const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
    const repoRoot = RepoRootCwdStub({ value: '/home/testuser' });
    proxy.setupQuestFound({ quest });
    proxy.setupResolveSuccess({ repoRoot });

    const result = await questRepoRootBroker({ questId: QuestIdStub({ value: quest.id }) });

    expect(result).toBe(repoRoot);
  });

  it('EDGE: {cwdResolveBroker rejects} => returns the guild path re-branded as RepoRootCwd', async () => {
    const proxy = questRepoRootBrokerProxy();
    const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
    proxy.setupQuestFound({ quest });
    proxy.setupResolveRejects();

    const result = await questRepoRootBroker({ questId: QuestIdStub({ value: quest.id }) });

    expect(result).toBe(RepoRootCwdStub({ value: String(proxy.getGuildPath()) }));
  });

  // A guild directory that carries no `.dungeonmaster.json` of its own (never carved a worktree,
  // never configured) does not make cwdResolveBroker reject — configRootFindBroker walks up past
  // it and resolves the first ANCESTOR .dungeonmaster.json it finds, which in a nested checkout
  // (e.g. a siege lane's guild seeded under `<repoRoot>/tmp/...`) is the enclosing repo's own
  // config, not anything belonging to this guild. Confirmed live against a real siege lane: a
  // resumed dispatch for a bare, non-git guild path spawned its child with `cwd` equal to the
  // orchestrator's OWN checkout root, not the guild path — the fake Claude CLI's cwd-scoped queue
  // directory landed at the enclosing repo's encoded path, never at the guild's. The broker has no
  // check that the resolved ancestor is actually the guild's own directory, so it returns whatever
  // cwdResolveBroker hands back — silently routing a broken guild's dispatch into an unrelated
  // project.
  it('EDGE: {cwdResolveBroker resolves to an ancestor above the guild path, not the guild path itself} => falls back to the guild path instead of trusting the escaped ancestor', async () => {
    const proxy = questRepoRootBrokerProxy();
    const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
    proxy.setupQuestFound({ quest });
    const guildPath = proxy.getGuildPath();
    const escapedAncestor = RepoRootCwdStub({ value: '/some/unrelated/ancestor/repo' });
    proxy.setupResolveSuccess({ repoRoot: escapedAncestor });

    const result = await questRepoRootBroker({ questId: QuestIdStub({ value: quest.id }) });

    expect(result).toBe(RepoRootCwdStub({ value: String(guildPath) }));
  });
});
