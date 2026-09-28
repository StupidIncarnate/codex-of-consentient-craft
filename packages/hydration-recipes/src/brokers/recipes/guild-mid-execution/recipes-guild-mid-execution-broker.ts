/**
 * PURPOSE: The `guild-mid-execution` recipe — one guild holding three quests, the first running
 * with codeweaver actually in progress and its riftcarver item dropped from the ledger. Reach for
 * this over other recipes when testing guild and quest orchestration mid-flight.
 *
 * `all.setRaw()` below touches only `status` — never `title` or `userRequest` — so quests 2 and 3
 * keep `questIngredientBroker`'s own per-index `defaults` ('Quest 2'/'Quest 3',
 * 'seeded quest 2'/'seeded quest 3') rather than collapsing onto one shared literal. That is the
 * ONLY thing that tells them apart: both stay `created` with an empty ledger on a `write` target —
 * on a live target every quest, this pair included, is minted by `questCreateBroker` with one
 * locked `chaoswhisperer` operation already `in_progress` (`quest-create-broker.ts`'s own words),
 * so quests 2 and 3 carry exactly that one item there; a mid-execution guild needs two untouched
 * quests sitting in the queue behind the running one, not two more variations on "in progress".
 *
 * `q[0]`'s `setRaw` also carries `flows`/`packagesAffected` now (`questGateContentDefaultsStatics`)
 * — on a `write` target these ride into the record exactly as they always could; on a live target
 * `questApiRouteBroker` carries them into a real modify call as `questReachRouteBroker` walks past
 * `explore_flows`, which is what lets the walk clear the REAL `flows_approved`/`approved` gates
 * (DEF-71) instead of being refused for missing content. Reaching `in_progress` for real also seeds
 * ONE riftcarver operation via the live START route — the same one `questBuildRelayGraphBroker`
 * always mints at the head of a fresh ledger — so the removal filter below is `expect: 'any'`, not
 * `'one'`: zero matches on a `write` target (nothing auto-seeds there), one match on a `write`
 * target's own hand-added riftcarver, or two on a live target (the auto-seeded one plus this
 * recipe's own) all resolve to the same intended end state — no riftcarver left on the ledger.
 *
 * That SAME live START route force-completes, rather than removes, the `chaoswhisperer` intake
 * operation every quest is minted with (`questBuildRelayGraphBroker`'s own "force-completes any
 * leftover chat-role intake items") — so a live target's ledger carries FIVE items, not four:
 * `chaoswhisperer: complete` alongside the intended codeweaver/ward/flowrider/siegemaster tail.
 * This is left as-is, matching `guild-active-suite`'s own precedent for the ledger a live target's
 * real Start auto-seeds ("nothing here asserts the ledger shape") — a SECOND `.filter().remove()`
 * on this same `operations` collection is not an option: `opFilterTransformer` gives every filter
 * on one collection the SAME static `matchedRef` symbol
 * (`guild[0:0]/quest[0:0]/operation[match]`), so `planPreflightBroker` refuses a second filter's
 * nested `remove` as a verb on an already-removed ref, regardless of its own `where` clause —
 * confirmed by reading `plan-preflight-broker.ts` and reproducing the exact
 * `HydrationRemovedHandleVerbError` this recipe hit before this comment was written. Removing an
 * item real production never removes would also have been the more dishonest fix.
 *
 * Nothing on this ledger is ever marked `in_progress` by a plain `.set({role})` — `codeweaver`
 * (o[0], the family's first tail role once riftcarver is gone) carries an explicit
 * `status: 'in_progress'` so "the first running" is literally true of the ledger, not just of the
 * quest's own `status` field; without it every remaining operation would read `pending` and a
 * "running" quest would show nothing actually running.
 *
 * USAGE:
 * const plan = recipesGuildMidExecutionBroker();
 * const result = await dmRegistryBroker.run(plan, target);
 */

import { guildMidExecutionStatics } from '../../../statics/guild-mid-execution/guild-mid-execution-statics';
import { operationFieldsContract } from '../../../contracts/operation-fields/operation-fields-contract';
import { questFieldsContract } from '../../../contracts/quest-fields/quest-fields-contract';
import { questGateContentDefaultsStatics } from '../../../statics/quest-gate-content-defaults/quest-gate-content-defaults-statics';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';

const { recipe } = recipesHydrationCreateBroker();

export const recipesGuildMidExecutionBroker = recipe(
  {
    name: 'guild-mid-execution',
    description:
      'one guild holding three quests — the first running with codeweaver actually in progress ' +
      'and its riftcarver item dropped, the second and third both freshly created and told apart ' +
      'only by their seeded title and request text ("Quest 2"/"Quest 3")',
  },
  () => [
    dmRegistryBroker.guilds.add(1, (g) => [
      g[0].quests.add(guildMidExecutionStatics.counts.quests, (q, all) => [
        all.setRaw({ status: questFieldsContract.shape.status.parse('created') }),
        q[0].setRaw({
          status: questFieldsContract.shape.status.parse('in_progress'),
          title: questFieldsContract.shape.title.parse('The running one'),
          flows: questFieldsContract.shape.flows.parse(questGateContentDefaultsStatics.flows),
          packagesAffected: questFieldsContract.shape.packagesAffected.parse(
            questGateContentDefaultsStatics.packagesAffected,
          ),
        }),
        q[0].operations.add(guildMidExecutionStatics.counts.operations, (o) => [
          o[0].set({
            role: operationFieldsContract.shape.role.parse('codeweaver'),
            status: operationFieldsContract.shape.status.parse('in_progress'),
          }),
          o[1].set({ role: operationFieldsContract.shape.role.parse('ward') }),
          o[2].set({ role: operationFieldsContract.shape.role.parse('riftcarver') }),
          o[3].set({ role: operationFieldsContract.shape.role.parse('flowrider') }),
          o[4].set({ role: operationFieldsContract.shape.role.parse('siegemaster') }),
        ]),
        q[0].operations
          .filter({
            where: { role: operationFieldsContract.shape.role.parse('riftcarver') },
            expect: 'any',
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
