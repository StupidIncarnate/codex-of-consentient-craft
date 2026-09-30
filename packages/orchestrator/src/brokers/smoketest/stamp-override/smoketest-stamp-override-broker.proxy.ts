import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock, registerModuleMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { join } from '#gateway/node/path';

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

export const smoketestStampOverrideBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: (params: { questId: string }) => void;
  getAllPersistedContents: () => readonly unknown[];
} => {
  // Wired to satisfy enforce-proxy-child-creation; the registerMock below replaces
  // questFindQuestPathBroker entirely, so this child's own fs/path staging is never exercised.
  // questFindQuestPathBroker's real body calls dungeonmasterHomeFindBroker() and then joins a
  // path through it directly — once ANY proxy in a composed test bypasses
  // dungeonmasterHomeFindBroker with a sticky mock (quest-find-quest-path-broker.proxy.ts does
  // this itself now), that real body's own pathJoin call never fires, leaving this child's
  // guildsDir/questFilePath onceFor staging permanently unconsumed and shifted onto whatever
  // real pathJoin call happens to run next. Addressing questFindQuestPathBroker directly by its
  // real argument (questId) sidesteps that internal chain altogether.
  questFindQuestPathBrokerProxy();
  const findQuestPathMock = registerMock({ fn: questFindQuestPathBroker });
  const joinHandle: MockHandle = registerMock({ fn: join });
  const loadProxy = questLoadBrokerProxy();
  // Wired to satisfy enforce-proxy-child-creation; the registerMock below replaces
  // questPersistBroker entirely. questPersistBroker's own real body appends to the outbox via
  // questOutboxAppendBroker, which composes the SAME dungeonmasterHomeFindBroker-bypass problem
  // described above one level deeper (its pathJoin(homePath, outbox-filename) onceFor staging
  // never gets consumed once dungeonmasterHomeFindBroker is bypassed, and shifts onto this
  // broker's OWN questFilePath join instead). Addressing questPersistBroker directly by its
  // real argument (questFilePath) sidesteps that chain too.
  questPersistBrokerProxy();
  const persistMock = registerMock({ fn: questPersistBroker });
  const lockProxy = questWithModifyLockBrokerProxy();
  lockProxy.setupEmpty();

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

      joinHandle
        .calledWith([questFolderPath, locationsStatics.quest.questFile])
        .returns(questFilePath);

      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });

      persistMock.calledWith([{ questFilePath }]).resolves({ success: true as const });
    },

    setupQuestNotFound: ({ questId }: { questId: string }): void => {
      findQuestPathMock.calledWith([{ questId }]).rejects(new QuestNotFoundError({ questId: QuestIdStub({ value: questId }) }));
    },

    // Read the `contents` argument straight off every questPersistBroker call this test made,
    // instead of the underlying `writeFile` — persistMock's real body never runs, so
    // nothing ever reaches it.
    getAllPersistedContents: (): readonly unknown[] =>
      persistMock.callsMatching([]).map((call) => {
        const [params] = call as [Parameters<typeof questPersistBroker>[0]];
        return params.contents;
      }),
  };
};
