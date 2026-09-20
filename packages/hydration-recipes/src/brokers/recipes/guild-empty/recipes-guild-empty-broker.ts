/**
 * PURPOSE: The `guild-empty` recipe — one empty guild with no quests or sessions, ready for initial
 * configuration. Reach for this over other recipes when testing guild lifecycle from a clean state.
 *
 * USAGE:
 * const plan = recipesGuildEmptyBroker();
 * const result = await dmRegistryBroker.run(plan, target);
 */

import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';

const { recipe } = recipesHydrationCreateBroker();

export const recipesGuildEmptyBroker = recipe(
  {
    name: 'guild-empty',
    description: 'one empty guild with no quests or sessions, ready for initial configuration',
  },
  () => [dmRegistryBroker.guilds.add(1, (g) => [g[0].saveRecordAs({ name: 'guild' })])],
);
