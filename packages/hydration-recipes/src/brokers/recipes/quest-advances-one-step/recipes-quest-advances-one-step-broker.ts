/**
 * PURPOSE: The `quest-advances-one-step` recipe — one quest under an existing guild, its ledger
 * already one operation along: the first item complete and the second running. Reach for this
 * over other recipes when testing step-by-step quest advancement under an existing guild.
 *
 * USAGE:
 * const plan = recipesQuestAdvancesOneStepBroker({ guildId: someGuildRecord.id });
 * const result = await dmRegistryBroker.run(plan, target);
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
