import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { randomUUID } from '#gateway/node/crypto';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FileContentsStub } from '@dungeonmaster/shared/contracts/file-contents/file-contents.stub';
import { FileNameStub } from '@dungeonmaster/shared/contracts/file-name/file-name.stub';
import { GuildConfigStub } from '@dungeonmaster/shared/contracts/guild-config/guild-config.stub';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';

import { guildGetBrokerProxy } from '../../../brokers/guild/get/guild-get-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questModifyBrokerProxy } from '../../../brokers/quest/modify/quest-modify-broker.proxy';
import { questOrchestrationLoopBrokerProxy } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker.proxy';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { QuestModifyResponder } from './quest-modify-responder';

type Quest = ReturnType<typeof QuestStub>;

export const QuestModifyResponderProxy = (): {
  callResponder: typeof QuestModifyResponder;
  setupQuestModifyFound: ReturnType<typeof questModifyBrokerProxy>['setupQuestFound'];
  setupQuestModifyEmpty: ReturnType<typeof questModifyBrokerProxy>['setupEmptyFolder'];
  setupAutoResume: (params: { quest: Quest }) => void;
} => {
  stderrProxy();
  const modifyProxy = questModifyBrokerProxy();
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const guildProxy = guildGetBrokerProxy();
  questOrchestrationLoopBrokerProxy();
  const eventsProxy = orchestrationEventsStateProxy();
  eventsProxy.setupEmpty();
  const stateProxy = orchestrationProcessesStateProxy();
  stateProxy.setupEmpty();

  registerMock({ fn: randomUUID }).calledWith([]).returns('f47ac10b-58cc-4372-a567-0e02b2c3d479');

  const setupPathResolution = ({ quest }: { quest: Quest }): void => {
    const guildId = GuildIdStub();
    const homePath = '/home/testuser/.dungeonmaster';
    const guildsDir = '/home/testuser/.dungeonmaster/guilds';
    const questsDirPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`;
    const questFolderPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`;
    const questFilePath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json`;
    const guildPath = '/home/testuser/project';

    findQuestPathProxy.setupQuestFound({
      homeDir: '/home/testuser',
      homePath,
      guildsDir,
      guilds: [
        {
          dirName: FileNameStub({ value: guildId }),
          questsDirPath,
          questFolders: [
            {
              folderName: FileNameStub({ value: quest.folder }),
              questFilePath,
              questFolderPath,
              contents: FileContentsStub({ value: JSON.stringify(quest) }),
            },
          ],
        },
      ],
    });

    const guild = GuildStub({ id: guildId, path: guildPath });
    // Same home as findQuestPathProxy above — one real process has one home, and
    // dungeonmasterHomeFindBroker() is a single shared, address-less mock.
    guildProxy.setupConfig({
      config: GuildConfigStub({ guilds: [guild] }),
      homeDir: '/home/testuser',
      homePath,
    });
  };

  return {
    callResponder: QuestModifyResponder,
    setupQuestModifyFound: modifyProxy.setupQuestFound,
    setupQuestModifyEmpty: modifyProxy.setupEmptyFolder,

    setupAutoResume: ({ quest }: { quest: Quest }): void => {
      modifyProxy.setupQuestFound({ quest });
      setupPathResolution({ quest });
    },
  };
};
