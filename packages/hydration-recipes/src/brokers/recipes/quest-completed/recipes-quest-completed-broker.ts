/**
 * PURPOSE: The `quest-completed` recipe — one guild holding one completed quest with all workflow
 * operations finished. Reach for this over other recipes when testing completed quest outcomes and
 * ledger verification.
 *
 * USAGE:
 * const plan = recipesQuestCompletedBroker();
 * const result = await dmRegistryBroker.run(plan, target);
 */

import { operationFieldsContract } from '../../../contracts/operation-fields/operation-fields-contract';
import { questFieldsContract } from '../../../contracts/quest-fields/quest-fields-contract';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';

const { recipe } = recipesHydrationCreateBroker();

const OPERATIONS_COUNT = 2;

export const recipesQuestCompletedBroker = recipe(
  {
    name: 'quest-completed',
    description: 'one guild holding one completed quest with all workflow operations finished',
  },
  () => [
    dmRegistryBroker.guilds.add(1, (g) => [
      g[0].quests.add(1, (q) => [
        q[0].setRaw({
          status: questFieldsContract.shape.status.parse('complete'),
          title: questFieldsContract.shape.title.parse('Verified Flow'),
        }),
        q[0].operations.add(OPERATIONS_COUNT, (o) => [
          o[0].set({ role: operationFieldsContract.shape.role.parse('codeweaver') }),
          o[1].set({ role: operationFieldsContract.shape.role.parse('ward') }),
        ]),
        q[0].saveRecordAs({ name: 'quest' }),
      ]),
      g[0].saveRecordAs({ name: 'guild' }),
    ]),
  ],
);
