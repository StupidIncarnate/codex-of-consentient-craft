/**
 * PURPOSE: The `guild-mid-execution` recipe — one guild holding three quests, the first running
 * with its riftcarver operation dropped from the ledger. Reach for this over other recipes when
 * testing guild and quest orchestration mid-flight.
 *
 * `all.setRaw()` below touches only `status` — never `title` or `userRequest` — so quests 2 and 3
 * keep `questIngredientBroker`'s own per-index `defaults` ('Quest 2'/'Quest 3',
 * 'seeded quest 2'/'seeded quest 3') rather than collapsing onto one shared literal. That is the
 * ONLY thing that tells them apart: both stay `created` with an empty ledger, on purpose — a
 * mid-execution guild needs two untouched quests sitting in the queue behind the running one, not
 * two more variations on "in progress".
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
      'one guild holding three quests — the first running with its riftcarver item dropped, ' +
      'the second and third both freshly created and told apart only by their seeded title ' +
      'and request text ("Quest 2"/"Quest 3")',
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
