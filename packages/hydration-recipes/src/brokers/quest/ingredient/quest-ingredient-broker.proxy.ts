import { recipesHydrationCreateBrokerProxy } from '../../recipes-hydration/create/recipes-hydration-create-broker.proxy';
import { questApiRouteBrokerProxy } from '../api-route/quest-api-route-broker.proxy';
import { questCorruptToLegacySchemaBrokerProxy } from '../corrupt-to-legacy-schema/quest-corrupt-to-legacy-schema-broker.proxy';
import { questQueryRouteBrokerProxy } from '../query-route/quest-query-route-broker.proxy';
import { questReachRouteBrokerProxy } from '../reach-route/quest-reach-route-broker.proxy';
import { questRemoveRouteBrokerProxy } from '../remove-route/quest-remove-route-broker.proxy';
import { questUpdateRouteBrokerProxy } from '../update-route/quest-update-route-broker.proxy';
import { questWardResultDetailWriteBrokerProxy } from '../ward-result-detail-write/quest-ward-result-detail-write-broker.proxy';
import { questWorkItemAttachBrokerProxy } from '../work-item-attach/quest-work-item-attach-broker.proxy';
import { questWriteRouteBrokerProxy } from '../write-route/quest-write-route-broker.proxy';

// This file's declaration runs at IMPORT TIME (`ingredient({...})` is a real call, not a
// deferred one), but none of the route/extra brokers below are themselves CALLED while
// declaring — only referenced as values. Every child proxy here is wired only to satisfy
// `enforce-proxy-child-creation`, never to stage a value.
export const questIngredientBrokerProxy = (): Record<PropertyKey, never> => {
  recipesHydrationCreateBrokerProxy();
  questApiRouteBrokerProxy();
  questCorruptToLegacySchemaBrokerProxy();
  questQueryRouteBrokerProxy();
  questReachRouteBrokerProxy();
  questRemoveRouteBrokerProxy();
  questUpdateRouteBrokerProxy();
  questWardResultDetailWriteBrokerProxy();
  questWorkItemAttachBrokerProxy();
  questWriteRouteBrokerProxy();
  return {};
};
