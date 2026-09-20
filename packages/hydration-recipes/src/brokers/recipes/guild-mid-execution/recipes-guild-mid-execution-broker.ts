/**
 * PURPOSE: The `guild-mid-execution` recipe — one guild holding three quests, the first running
 * with its riftcarver operation dropped from the ledger. Reach for this over other recipes when
 * testing guild and quest orchestration mid-flight.
 *
 * USAGE:
 * const plan = recipesGuildMidExecutionBroker();
 * const result = await dmRegistryBroker.run(plan, target);
 */

import { guildMidExecutionStatics } from '../../../statics/guild-mid-execution/guild-mid-execution-statics';
import { operationFieldsContract } from '../../../contracts/operation-fields/operation-fields-contract';
import { questFieldsContract } from '../../../contracts/quest-fields/quest-fields-contract';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';

const { recipe } = recipesHydrationCreateBroker();

export const recipesGuildMidExecutionBroker = recipe(
  {
    name: 'guild-mid-execution',
    description:
      'one guild holding three quests, the first running with its riftcarver item dropped',
  },
  () => [
    dmRegistryBroker.guilds.add(1, (g) => [
      g[0].quests.add(guildMidExecutionStatics.counts.quests, (q, all) => [
        all.setRaw({ status: questFieldsContract.shape.status.parse('created') }),
        q[0].setRaw({
          status: questFieldsContract.shape.status.parse('in_progress'),
          title: questFieldsContract.shape.title.parse('The running one'),
        }),
        q[0].operations.add(guildMidExecutionStatics.counts.operations, (o) => [
          o[0].set({ role: operationFieldsContract.shape.role.parse('codeweaver') }),
          o[1].set({ role: operationFieldsContract.shape.role.parse('ward') }),
          o[2].set({ role: operationFieldsContract.shape.role.parse('riftcarver') }),
          o[3].set({ role: operationFieldsContract.shape.role.parse('flowrider') }),
          o[4].set({ role: operationFieldsContract.shape.role.parse('siegemaster') }),
        ]),
        q[0].operations
          .filter({
            where: { role: operationFieldsContract.shape.role.parse('riftcarver') },
            expect: 'one',
          })
          .remove(),
        q[0].saveRecordAs({ name: 'quest1' }),
        q[1].saveRecordAs({ name: 'quest2' }),
        q[2].saveRecordAs({ name: 'quest3' }),
      ]),
      g[0].saveRecordAs({ name: 'guild' }),
    ]),
  ],
);
