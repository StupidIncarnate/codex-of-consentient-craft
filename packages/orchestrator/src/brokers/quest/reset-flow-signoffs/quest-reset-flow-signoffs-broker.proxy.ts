import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub, GuildIdStub } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';
import {
  registerMock,
  registerModuleMock,
  registerSpyOn,
} from '@dungeonmaster/testing/register-mock';

import { QuestNotFoundError } from '../../../errors/quest-not-found/quest-not-found-error';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';
import { questPersistBroker } from '../persist/quest-persist-broker';
import { questPersistBrokerProxy } from '../persist/quest-persist-broker.proxy';
import { questWithModifyLockBrokerProxy } from '../with-modify-lock/quest-with-modify-lock-broker.proxy';

registerModuleMock({ module: '../find-quest-path/quest-find-quest-path-broker' });
registerModuleMock({ module: '../persist/quest-persist-broker' });

type Quest = ReturnType<typeof QuestStub>;

// Pins both the walk-reset note's `at` and the quest's `updatedAt` so a test can assert the WHOLE
// persisted quest instead of picking around two moving timestamps. The test file repeats this
// literal in its expectations rather than reading it back off the proxy.
const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';

export const questResetFlowSignoffsBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  getPersistedQuests: () => readonly unknown[];
} => {
  // Wired to satisfy enforce-proxy-child-creation; the registerMock below replaces
  // questFindQuestPathBroker entirely, so this child's own fs/path staging is never exercised.
  // Addressing the broker directly by its real argument (questId) sidesteps its internal
  // dungeonmasterHomeFindBroker → pathJoin chain, whose staging would otherwise sit unconsumed and
  // shift onto this broker's own questFilePath join.
  questFindQuestPathBrokerProxy();
  const findQuestPathMock = registerMock({ fn: questFindQuestPathBroker });
  const pathJoinProxy = pathJoinAdapterProxy();
  const loadProxy = questLoadBrokerProxy();
  // Same reasoning: questPersistBroker's real body appends to the outbox through another
  // dungeonmasterHomeFindBroker → pathJoin chain, so it is replaced wholesale and addressed by its
  // own questFilePath argument.
  questPersistBrokerProxy();
  const persistMock = registerMock({ fn: questPersistBroker });
  const lockProxy = questWithModifyLockBrokerProxy();
  lockProxy.setupEmpty();

  // toISOString takes no identifying argument, so `[]` is the honest address.
  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns(FIXED_TIMESTAMP);

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
      // No quest to key on — this scenario searches for whatever questId it was given and finds
      // nothing, so `[]` honestly describes "not found, for any questId".
      findQuestPathMock.calledWith([]).rejects(new QuestNotFoundError({ questId: 'unknown' }));
    },

    // The `contents` argument of every questPersistBroker call, parsed back into a quest object —
    // persistMock's real body never runs, so nothing reaches fsWriteFileAdapter.
    getPersistedQuests: (): readonly unknown[] =>
      persistMock.callsMatching([]).map((call) => {
        const [params] = call as [Parameters<typeof questPersistBroker>[0]];
        return JSON.parse(String(params.contents)) as unknown;
      }),
  };
};
