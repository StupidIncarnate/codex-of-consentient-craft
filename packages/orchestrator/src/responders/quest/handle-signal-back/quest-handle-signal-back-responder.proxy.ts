import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../../../brokers/quest/modify/quest-modify-broker.proxy';
import { questPostWalkHookBrokerProxy } from '../../../brokers/quest/post-walk-hook/quest-post-walk-hook-broker.proxy';
import { QuestHandleSignalBackResponder } from './quest-handle-signal-back-responder';

type Quest = ReturnType<typeof QuestStub>;

export const QuestHandleSignalBackResponderProxy = (): {
  callResponder: typeof QuestHandleSignalBackResponder;
  setupQuest: (params: { quest: Quest }) => void;
  getAllPersistedContents: () => readonly unknown[];
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const hookProxy = questPostWalkHookBrokerProxy();

  return {
    callResponder: QuestHandleSignalBackResponder,
    setupQuest: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      hookProxy.setupQuest({ quest });
    },
    getAllPersistedContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),
  };
};
