import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questCreateBrokerProxy } from '../../brokers/quest/create/quest-create-broker.proxy';

export const QuestListWidgetProxy = (): {
  setupCreateSuccess: () => void;
} => {
  const createProxy = questCreateBrokerProxy();

  return {
    setupCreateSuccess: (): void => {
      createProxy.setupCreate({ id: QuestIdStub({ value: 'new-quest' }) });
    },
  };
};
