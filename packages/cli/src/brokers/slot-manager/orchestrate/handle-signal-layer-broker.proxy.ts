import { questUpdateStepBrokerProxy } from '../../quest/update-step/quest-update-step-broker.proxy';

export const handleSignalLayerBrokerProxy = (): {
  setupQuestUpdateSuccess: (params: { questJson: string }) => void;
  getWrittenQuestContent: () => unknown;
} => {
  const questUpdateStepProxy = questUpdateStepBrokerProxy();

  jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T10:00:00.000Z');

  return {
    setupQuestUpdateSuccess: ({ questJson }: { questJson: string }): void => {
      questUpdateStepProxy.setupQuestRead({ questJson });
      questUpdateStepProxy.setupQuestWriteSuccess();
    },
    getWrittenQuestContent: (): unknown => questUpdateStepProxy.getQuestWrittenContent(),
  };
};
