import { fsMkdirAdapterProxy, pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { questPersistBrokerProxy } from '../persist/quest-persist-broker.proxy';
import { questResolveQuestsPathBrokerProxy } from '../resolve-quests-path/quest-resolve-quests-path-broker.proxy';
import { buildHydrateInputLayerBrokerProxy } from './build-hydrate-input-layer-broker.proxy';

export const questHydrateBrokerProxy = (): Record<PropertyKey, never> => {
  fsMkdirAdapterProxy();
  pathJoinAdapterProxy();
  questLoadBrokerProxy();
  questModifyBrokerProxy();
  questPersistBrokerProxy();
  questResolveQuestsPathBrokerProxy();
  buildHydrateInputLayerBrokerProxy();
  return {};
};
