/**
 * PURPOSE: The `quest-advances-one-step` recipe — one quest under an existing guild, its ledger
 * already one operation along: the first item complete and the second running.
 *
 * Part 5's own worked example describes this recipe advancing a quest an EARLIER step already
 * created, by id. That is not buildable against this repo's actual ingredient set, for TWO
 * independent reasons, both findings for
 * `scrolls/seigelense/plans/recipes-chunk-07-repo-ingredients.md`:
 *
 * 1. The chain has no verb that reaches a row NOT created within the running plan (Q7-6's open
 *    gap: "If a verb is wanted later it is `attach({id})` on a collection") — the quest ingredient
 *    NOW declares `transitions` on `status` (`quest-reach-route-broker.ts`, group P4), but a walk
 *    only ever moves a row THIS plan created, never one an earlier step minted.
 * 2. `.under()` does not carry ancestor names forward for TYPE purposes: `collectionChainTransformer`
 *    passes the SAME (empty, at top level) `ancestorNames` into the child collection it returns, so
 *    a row made via `dm.quests.under({ guildId })` exposes NO child accessors at all —
 *    `q[0].operations` fails to typecheck (`TS2339`) even though the runtime link value is real.
 *    The specification's own worked `.under()` fixture (`every-chainable.ts`) never chains a child
 *    accessor off it either, which reads, in hindsight, as this same limitation rather than an
 *    unexercised case.
 *
 * So this recipe seeds a FRESH quest under the existing guild via `.under({ guildId })` and writes
 * its ledger through the plain `operations` FIELD `set()` already reaches (`operations` carries a
 * zod default on `questContract`, but Q7-1's ruling keeps it on `fields` too, precisely for this
 * kind of direct seed) — never through the `operation` ingredient's own child accessor, which
 * `.under()` makes unreachable here. The end state Part 5 names — "one operation further along
 * than it was" — is what a caller reads off the result; how this recipe reaches it is the finding.
 *
 * `status` is set via `setRaw`, not `set`: `in_progress` is on the ingredient's own `transitions.to`
 * list, but reaching it FOR REAL seeds the operations relay through the server's own start route —
 * exactly what this recipe does NOT want, since it hand-builds a SPECIFIC two-item ledger the real
 * relay would never produce on its own. `setRaw` writes the field with no walk, which is what makes
 * this recipe runnable on a write-only target at all.
 *
 * USAGE:
 * const plan = questAdvancesOneStepRecipeBroker({ guildId: someGuildRecord.id });
 * const result = await dmRegistryBroker.run(plan, target);
 * // result.quest is the QuestRecord with its ledger already advanced
 */
import { operationItemContract } from '@dungeonmaster/shared/contracts';

import { questAdvancesOneStepInputsContract } from '../../../contracts/quest-advances-one-step-inputs/quest-advances-one-step-inputs-contract';
import { questFieldsContract } from '../../../contracts/quest-fields/quest-fields-contract';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';

const { recipe } = recipesHydrationCreateBroker();

const FIRST_OPERATION_ID = operationItemContract.shape.id.parse(
  '00000000-0000-4000-8000-000000000001',
);
const SECOND_OPERATION_ID = operationItemContract.shape.id.parse(
  '00000000-0000-4000-8000-000000000002',
);

export const questAdvancesOneStepRecipeBroker = recipe(
  {
    name: 'quest-advances-one-step',
    description:
      'one quest under an existing guild, its ledger already one operation along — the first item complete and the second running',
    inputs: questAdvancesOneStepInputsContract,
  },
  ({ guildId }) => [
    dmRegistryBroker.quests.under({ guildId }).add(1, (q) => [
      q[0].setRaw({
        status: questFieldsContract.shape.status.parse('in_progress'),
        title: questFieldsContract.shape.title.parse('Advancing quest'),
        operations: [
          operationItemContract.parse({
            id: FIRST_OPERATION_ID,
            role: 'codeweaver',
            text: 'Seeded operation 1',
            status: 'complete',
            locked: false,
            flowIds: [],
            packageNames: [],
          }),
          operationItemContract.parse({
            id: SECOND_OPERATION_ID,
            role: 'ward',
            text: 'Seeded operation 2',
            status: 'in_progress',
            locked: false,
            flowIds: [],
            packageNames: [],
          }),
        ],
      }),
      q[0].saveRecordAs({ name: 'quest' }),
    ]),
  ],
);
