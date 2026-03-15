import { questUpdateStepBrokerProxy } from '../../quest/update-step/quest-update-step-broker.proxy';

export const workTrackerQuestStepBrokerProxy = (): {
  setupQuestRead: (params: { questJson: string }) => void;
  setupQuestReadError: (params: { error: Error }) => void;
  setupQuestWriteSuccess: () => void;
  setupQuestWriteError: (params: { error: Error }) => void;
  getQuestWrittenContent: () => unknown;
} => {
  const updateStepProxy = questUpdateStepBrokerProxy();

  return {
    setupQuestRead: ({ questJson }: { questJson: string }): void => {
      updateStepProxy.setupQuestRead({ questJson });
    },
    setupQuestReadError: ({ error }: { error: Error }): void => {
      updateStepProxy.setupQuestReadError({ error });
    },
    setupQuestWriteSuccess: (): void => {
      updateStepProxy.setupQuestWriteSuccess();
    },
    setupQuestWriteError: ({ error }: { error: Error }): void => {
      updateStepProxy.setupQuestWriteError({ error });
    },
    getQuestWrittenContent: (): unknown => updateStepProxy.getQuestWrittenContent(),
  };
};
