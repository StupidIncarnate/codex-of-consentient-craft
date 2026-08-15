import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub, GuildIdStub, questContract } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';

import { QuestNotFoundError } from '../../../errors/quest-not-found/quest-not-found-error';
import { questFindQuestPathBroker } from '../../quest/find-quest-path/quest-find-quest-path-broker';
import { questFindQuestPathBrokerProxy } from '../../quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../../quest/load/quest-load-broker.proxy';
import { questPersistBroker } from '../../quest/persist/quest-persist-broker';
import { questPersistBrokerProxy } from '../../quest/persist/quest-persist-broker.proxy';
import { questWithModifyLockBrokerProxy } from '../../quest/with-modify-lock/quest-with-modify-lock-broker.proxy';

registerModuleMock({ module: '../../quest/find-quest-path/quest-find-quest-path-broker' });
registerModuleMock({ module: '../../quest/persist/quest-persist-broker' });

type Quest = ReturnType<typeof QuestStub>;

export const smoketestSignOutstandingUnitsBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  getAllPersistedContents: () => readonly unknown[];
  // The persisted bytes parsed back into quests, so a test can read the sign-offs the broker wrote
  // onto the flow graph rather than string-matching JSON.
  getPersistedQuests: () => readonly Quest[];
} => {
  // Wired to satisfy enforce-proxy-child-creation; the registerMock below replaces
  // questFindQuestPathBroker entirely, so this child's own fs/path staging is never exercised. The
  // reason for addressing the broker directly (rather than through its own chain) is the one
  // smoketest-stamp-override-broker.proxy.ts documents: once any proxy bypasses
  // dungeonmasterHomeFindBroker with a sticky mock, the child's internal pathJoin staging is never
  // consumed and shifts onto whatever real join runs next.
  questFindQuestPathBrokerProxy();
  const findQuestPathMock = registerMock({ fn: questFindQuestPathBroker });
  const pathJoinProxy = pathJoinAdapterProxy();
  const loadProxy = questLoadBrokerProxy();
  questPersistBrokerProxy();
  const persistMock = registerMock({ fn: questPersistBroker });
  const lockProxy = questWithModifyLockBrokerProxy();
  lockProxy.setupEmpty();
  // The broker stamps `at` and `updatedAt` off the wall clock, and the clock is already pinned to
  // '2024-01-15T10:00:00.000Z' by questPersistBrokerProxy's own outbox chain. Staging it a second
  // time here would COLLIDE at equal specificity with every sibling proxy that composes a persist —
  // `Date.prototype.toISOString` takes no argument, so there is no discriminating address to fix
  // that with, and the winner would depend on construction order.

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      const guildId = GuildIdStub();
      const questFolderPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`,
      });
      const questFilePath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json`,
      });

      findQuestPathMock
        .calledWith([{ questId: quest.id }])
        .resolves({ questPath: questFolderPath, guildId });

      pathJoinProxy.returns({ result: questFilePath });

      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });

      persistMock.calledWith([{ questFilePath }]).resolves({ success: true as const });
    },

    setupQuestNotFound: (): void => {
      findQuestPathMock.calledWith([]).rejects(new QuestNotFoundError({ questId: 'unknown' }));
    },

    getAllPersistedContents: (): readonly unknown[] =>
      persistMock.callsMatching([]).map((call) => {
        const [params] = call as [Parameters<typeof questPersistBroker>[0]];
        return params.contents;
      }),

    getPersistedQuests: (): readonly Quest[] =>
      persistMock.callsMatching([]).map((call) => {
        const [params] = call as [Parameters<typeof questPersistBroker>[0]];
        return questContract.parse(JSON.parse(String(params.contents)));
      }),
  };
};
