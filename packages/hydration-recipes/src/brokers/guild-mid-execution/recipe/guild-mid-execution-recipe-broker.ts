/**
 * PURPOSE: The `guild-mid-execution` recipe — one guild holding three quests, the first running
 * with its riftcarver operation dropped from the ledger. This is Part 5's own worked composition
 * example, proved against this repo's real ingredients rather than left as a doc snippet.
 *
 * The quest ingredient declares `transitions` on `status` now, so `set({ status: … })` WALKS —
 * `in_progress` through the real relay-seeding route, which needs a server this recipe's own
 * integration test does not have. "Running" here is deliberately built the OTHER way instead:
 * `setRaw({ status: 'in_progress', … })` writes the field with no walk, and the ledger is seeded
 * directly through the `operation` ingredient's own `add`, never through a transition that would
 * have minted it. `created` is off the ingredient's own `to` list too (nothing ever transitions
 * BACK to a row's starting value), so `all`'s own status write uses `setRaw` for the same reason.
 * The end state Part 5 describes is unchanged; only how this recipe reaches it is.
 *
 * `q[0].operations.filter({ where: { role: 'riftcarver' }, expect: 'one' }).remove()` is the
 * specification's own headline `filter` example, and this is what proves it against a real
 * ledger this recipe seeded rather than one a transition minted.
 *
 * USAGE:
 * const plan = guildMidExecutionRecipeBroker();
 * const result = await run(plan, target);
 */
import { guildMidExecutionStatics } from '../../../statics/guild-mid-execution/guild-mid-execution-statics';
import { operationFieldsContract } from '../../../contracts/operation-fields/operation-fields-contract';
import { questFieldsContract } from '../../../contracts/quest-fields/quest-fields-contract';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';

const { recipe } = recipesHydrationCreateBroker();

export const guildMidExecutionRecipeBroker = recipe(
  {
    name: 'guild-mid-execution',
    description:
      'one guild holding three quests, the first running with its riftcarver item dropped',
  },
  () => [
    dmRegistryBroker.guilds.add(1, (g) => [
      g[0].quests.add(guildMidExecutionStatics.counts.quests, (q, all) => [
        // `status` has no zod default on `questContract` (unlike `operations`/`workItems`), and
        // the quest ingredient's own `defaults(index)` mints `created` — every row still needs an
        // explicit value here since `created` is off `transitions.to`, so `all.setRaw()` runs
        // first and a per-row `.setRaw()` can still override it.
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
