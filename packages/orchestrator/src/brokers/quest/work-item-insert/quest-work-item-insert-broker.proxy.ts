import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const questWorkItemInsertBrokerProxy = (): {
  setupQuestModify: (params: { quest: Quest }) => void;
  setupModifyFailure: () => void;
  getPersistedQuests: () => readonly unknown[];
} => {
  const modifyProxy = questModifyBrokerProxy();

  return {
    setupQuestModify: ({ quest }: { quest: Quest }): void => {
      modifyProxy.setupQuestFound({ quest });
    },

    // Makes the underlying questModifyBroker resolve `{ success: false, ... }` for the next call,
    // so a test can prove questWorkItemInsertBroker passes that failure through instead of masking
    // it behind a hardcoded `{ success: true }`.
    setupModifyFailure: (): void => {
      modifyProxy.setupResolveFailureOnce();
    },

    getPersistedQuests: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),
  };
};
