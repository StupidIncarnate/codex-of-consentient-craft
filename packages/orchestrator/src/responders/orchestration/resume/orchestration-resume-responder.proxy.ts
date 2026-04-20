import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { questContract } from '@dungeonmaster/shared/contracts';

import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../../../brokers/quest/modify/quest-modify-broker.proxy';
import { OrchestrationResumeResponder } from './orchestration-resume-responder';

type Quest = ReturnType<typeof QuestStub>;

export const OrchestrationResumeResponderProxy = (): {
  callResponder: typeof OrchestrationResumeResponder;
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  setupModifyReject: (params: { error: Error }) => void;
  getAllPersistedContents: () => readonly unknown[];
  getLastPersistedQuest: () => ReturnType<typeof questContract.parse>;
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();

  return {
    callResponder: OrchestrationResumeResponder,

    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },

    setupModifyReject: ({ error }: { error: Error }): void => {
      modifyProxy.setupReject({ error });
    },

    getAllPersistedContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),

    getLastPersistedQuest: (): ReturnType<typeof questContract.parse> => {
      const persisted = modifyProxy.getAllPersistedContents();
      const lastWrite = persisted[persisted.length - 1];
      return questContract.parse(JSON.parse(String(lastWrite)));
    },
  };
};
