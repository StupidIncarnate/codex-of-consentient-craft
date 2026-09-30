/**
 * PURPOSE: The `quest-advances-one-step` recipe — one quest under an existing guild, its ledger
 * already one operation along: the first item complete and the second running. Reach for this
 * over other recipes when testing step-by-step quest advancement under an existing guild.
 *
 * `status`/`title` ride the create-time `setRaw()` right after `add()`, folded straight into the
 * quest's own create op — `questWriteRouteBroker`'s own header names this exact case. The two
 * ledger operations mint through the real `operation` ingredient's `.add()`, as a SIBLING top-level
 * call reached through its OWN `.under({questId, guildId})` rather than through
 * `q[0].operations.add(...)`: a row minted under `dmRegistryBroker.quests.under({guildId})` carries
 * no ancestor NAME for a child accessor to resolve (`packages/hydration/CLAUDE.md`'s "`.under()`
 * does not carry ancestor names forward for child accessors" section), so `operations.under(...)`
 * supplies both foreign keys directly instead — `guildId` straight from this recipe's own input,
 * `questId` via `fromSavedRefTransformer({name: 'quest', field: 'id'})` since the quest is minted
 * earlier IN THIS SAME plan and `opCreateApplyLayerBroker` resolves that reference against
 * `state.saved` before the operation's own create op runs. No fixed-literal operation id anywhere
 * in this file — both ids are minted by `operationWriteRouteBroker` at run time, the same as
 * `quest-completed`'s own recipe.
 *
 * `q[0]`'s `setRaw` also carries `flows`/`packagesAffected` (`questGateContentDefaultsStatics`) —
 * needed on a live target, where `questApiRouteBroker` walks the freshly-minted `created` quest to
 * `in_progress` through `questReachRouteBroker`, clearing the real `flows_approved`/`approved` gates
 * along the way (DEF-71) exactly as `guild-mid-execution`'s own header explains. That walk seeds ONE
 * riftcarver operation via the live START route on its way to `in_progress` — absent on a `write`
 * target, present on a live one — so a THIRD top-level op drops it by `questId` before the two
 * hand-seeded operations are asserted as the whole ledger; `expect: 'any'` tolerates both the zero
 * matches a `write` target leaves and the one match a live target does.
 *
 * USAGE:
 * const plan = recipesQuestAdvancesOneStepBroker({ guildId: someGuildRecord.id });
 * const result = await dmRegistryBroker.run(plan, target);
 */

import { fieldNameContract } from '@dungeonmaster/hydration/contracts';
import { fromSavedRefTransformer } from '@dungeonmaster/hydration/transformers';

import { operationFieldsContract } from '../../../contracts/operation-fields/operation-fields-contract';
import { questAdvancesOneStepInputsContract } from '../../../contracts/quest-advances-one-step-inputs/quest-advances-one-step-inputs-contract';
import { questFieldsContract } from '../../../contracts/quest-fields/quest-fields-contract';
import { questGateContentDefaultsStatics } from '../../../statics/quest-gate-content-defaults/quest-gate-content-defaults-statics';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';

const { recipe } = recipesHydrationCreateBroker();

const QUEST_SAVED_NAME = 'quest';
const QUEST_ID_FIELD = fieldNameContract.parse('id');
const OPERATION_COUNT = 2;

export const recipesQuestAdvancesOneStepBroker = recipe(
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
        flows: questFieldsContract.shape.flows.parse(questGateContentDefaultsStatics.flows),
        packagesAffected: questFieldsContract.shape.packagesAffected.parse(
          questGateContentDefaultsStatics.packagesAffected,
        ),
      }),
      q[0].saveRecordAs({ name: QUEST_SAVED_NAME }),
    ]),
    // Drops the riftcarver operation a live target's real START route auto-seeds on the way to
    // `in_progress` above — see this file's own header for why `expect: 'any'` is what makes this
    // safe on both target kinds.
    dmRegistryBroker.operations
      .filter({
        where: {
          questId: fromSavedRefTransformer({ name: QUEST_SAVED_NAME, field: QUEST_ID_FIELD }),
          role: operationFieldsContract.shape.role.parse('riftcarver'),
        },
        expect: 'any',
      })
      .remove(),
    dmRegistryBroker.operations
      .under({
        questId: fromSavedRefTransformer({ name: QUEST_SAVED_NAME, field: QUEST_ID_FIELD }),
        guildId,
      })
      .add(OPERATION_COUNT, (ops) => [
        ops[0].setRaw({
          role: 'codeweaver',
          text: operationFieldsContract.shape.text.parse('Seeded operation 1'),
          status: 'complete',
        }),
        ops[1].setRaw({
          role: 'ward',
          text: operationFieldsContract.shape.text.parse('Seeded operation 2'),
          status: 'in_progress',
        }),
      ]),
  ],
);
