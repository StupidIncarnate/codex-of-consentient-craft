import { QuestIdStub, QuestStub, RepoRootCwdStub } from '@dungeonmaster/shared/contracts';

import { questRepoRootBroker } from './quest-repo-root-broker';
import { questRepoRootBrokerProxy } from './quest-repo-root-broker.proxy';

describe('questRepoRootBroker', () => {
  it('VALID: {cwdResolveBroker resolves} => returns the resolved repo root', async () => {
    const proxy = questRepoRootBrokerProxy();
    const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });
    const repoRoot = RepoRootCwdStub({ value: '/resolved/repo/root' });
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
});
