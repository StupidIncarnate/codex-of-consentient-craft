import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import {
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildConfigStub,
  GuildIdStub,
  GuildStub,
} from '@dungeonmaster/shared/contracts';

import { chatStreamProcessHandleBrokerProxy } from '../../../brokers/chat/stream-process-handle/chat-stream-process-handle-broker.proxy';
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
  chatStreamProcessHandleBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const guildProxy = guildGetBrokerProxy();
  questOrchestrationLoopBrokerProxy();
  const eventsProxy = orchestrationEventsStateProxy();
  eventsProxy.setupEmpty();
  const stateProxy = orchestrationProcessesStateProxy();
  stateProxy.setupEmpty();

  registerSpyOn({ object: crypto, method: 'randomUUID' }).mockReturnValue(
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  );

  const setupPathResolution = ({ quest }: { quest: Quest }): void => {
    const guildId = GuildIdStub();
    const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
    const guildsDir = FilePathStub({ value: '/home/testuser/.dungeonmaster/guilds' });
    const questsDirPath = FilePathStub({
      value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
    });
    const questFolderPath = FilePathStub({
      value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`,
    });
    const questFilePath = FilePathStub({
      value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json`,
    });
    const guildPath = FilePathStub({ value: '/home/testuser/project' });

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
    guildProxy.setupConfig({ config: GuildConfigStub({ guilds: [guild] }) });
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
