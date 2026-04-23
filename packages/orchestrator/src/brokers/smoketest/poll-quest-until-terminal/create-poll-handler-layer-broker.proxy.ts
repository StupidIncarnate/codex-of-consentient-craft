import { loadQuestByIdLayerBrokerProxy } from './load-quest-by-id-layer-broker.proxy';

export const createPollHandlerLayerBrokerProxy = (): ReturnType<
  typeof loadQuestByIdLayerBrokerProxy
> => loadQuestByIdLayerBrokerProxy();
