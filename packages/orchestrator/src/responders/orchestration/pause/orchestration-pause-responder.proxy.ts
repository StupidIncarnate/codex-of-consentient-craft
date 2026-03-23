import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { ProcessIdStub, questContract } from '@dungeonmaster/shared/contracts';

import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../../../brokers/quest/modify/quest-modify-broker.proxy';
import { OrchestrationProcessStub } from '../../../contracts/orchestration-process/orchestration-process.stub';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { OrchestrationPauseResponder } from './orchestration-pause-responder';

type Quest = ReturnType<typeof QuestStub>;

export const OrchestrationPauseResponderProxy = (): {
  callResponder: typeof OrchestrationPauseResponder;
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  setupWithRunningProcess: (params: { quest: Quest; kill: jest.Mock }) => void;
  getAllPersistedContents: () => readonly unknown[];
  getLastPersistedQuest: () => ReturnType<typeof questContract.parse>;
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const stateProxy = orchestrationProcessesStateProxy();
  stateProxy.setupEmpty();

  return {
    callResponder: OrchestrationPauseResponder,

    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },

    setupWithRunningProcess: ({ quest, kill }: { quest: Quest; kill: jest.Mock }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      const processId = ProcessIdStub();
      stateProxy.setupWithProcess({
        orchestrationProcess: OrchestrationProcessStub({
          processId,
          questId: quest.id,
          kill,
        }),
      });
    },

    getAllPersistedContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),

    getLastPersistedQuest: (): ReturnType<typeof questContract.parse> => {
      const persisted = modifyProxy.getAllPersistedContents();
      const lastWrite = persisted[persisted.length - 1];
      return questContract.parse(JSON.parse(String(lastWrite)));
    },
  };
};
