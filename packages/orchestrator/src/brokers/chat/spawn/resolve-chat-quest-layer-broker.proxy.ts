import { questGetBrokerProxy } from '../../quest/get/quest-get-broker.proxy';
import { questUserAddBrokerProxy } from '../../quest/user-add/quest-user-add-broker.proxy';

type QuestFoundParams = Parameters<ReturnType<typeof questGetBrokerProxy>['setupQuestFound']>[0];

export const resolveChatQuestLayerBrokerProxy = (): {
  setupQuestFound: (params: QuestFoundParams) => void;
  setupQuestNotFound: () => void;
  setupQuestCreationFailure: (params: { error: Error }) => void;
} => {
  const getProxy = questGetBrokerProxy();
  const addProxy = questUserAddBrokerProxy();

  return {
    setupQuestFound: (params: QuestFoundParams): void => {
      getProxy.setupQuestFound(params);
    },
    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },
    // Fails the questUserAddBroker path (chaoswhisperer new-quest creation) so callers
    // asserting on "Failed to create quest" error message get the expected throw.
    setupQuestCreationFailure: ({ error }: { error: Error }): void => {
      addProxy.setupCreateFailure({ error });
    },
  };
};
