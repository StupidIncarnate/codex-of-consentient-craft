/**
 * PURPOSE: The `guild-with-three-quests` recipe — one guild holding three quests: one created,
 * one in_progress, and one complete. Reach for this over other recipes when testing multi-quest
 * state progression under a single guild.
 *
 * USAGE:
 * const plan = recipesGuildWithThreeQuestsBroker();
 * const result = await dmRegistryBroker.run(plan, target);
 */

import { questFieldsContract } from '../../../contracts/quest-fields/quest-fields-contract';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';

const { recipe } = recipesHydrationCreateBroker();

const QUEST_COUNT = 3;

export const recipesGuildWithThreeQuestsBroker = recipe(
  {
    name: 'guild-with-three-quests',
    description: 'one guild holding three quests: one created, one in_progress, and one complete',
  },
  () => [
    dmRegistryBroker.guilds.add(1, (g) => [
      g[0].quests.add(QUEST_COUNT, (q) => [
        q[0].setRaw({
          status: questFieldsContract.shape.status.parse('created'),
          title: questFieldsContract.shape.title.parse('Setup Database'),
        }),
        q[1].setRaw({
          status: questFieldsContract.shape.status.parse('in_progress'),
          title: questFieldsContract.shape.title.parse('Implement Authentication'),
        }),
        q[2].setRaw({
          status: questFieldsContract.shape.status.parse('complete'),
          title: questFieldsContract.shape.title.parse('Scaffold Architecture'),
        }),
        q[0].saveRecordAs({ name: 'questCreated' }),
        q[1].saveRecordAs({ name: 'questInProgress' }),
        q[2].saveRecordAs({ name: 'questComplete' }),
      ]),
      g[0].saveRecordAs({ name: 'guild' }),
    ]),
  ],
);
