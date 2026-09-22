/**
 * PURPOSE: The `quest-completed` recipe — one guild holding one completed quest with all workflow
 * operations AND work items finished. Reach for this over other recipes when testing completed
 * quest outcomes and ledger verification.
 *
 * `workItems` below is folded into the quest's CREATE call — `questWriteRouteBroker`'s own header
 * names this exact case — because it rides the SAME `setRaw()` that sets `status`/`title` right
 * after `add()`, before the row has a route call of its own. It never reaches `questModifyBroker`,
 * whose per-status allowlist (`questStatusInputAllowlistStatics`) refuses `workItems` at every
 * status — that broker is server-only, reached through advance/signal-back/ward/riftcarver, never
 * through modify-quest. A `set()` placed AFTER this create — on a row that already exists — would
 * go through that gate and be rejected.
 *
 * The work-item ids and `createdAt` below are fixed literals rather than `crypto.randomUUID()` /
 * `Date.now()`: a recipe's plan is data assembled once at build time
 * (`packages/hydration/CLAUDE.md`, "A plan is DATA"), so two builds of this same plan stay
 * byte-identical.
 *
 * USAGE:
 * const plan = recipesQuestCompletedBroker();
 * const result = await dmRegistryBroker.run(plan, target);
 */

import { questWorkItemIdContract, workItemContract } from '@dungeonmaster/shared/contracts';

import { operationFieldsContract } from '../../../contracts/operation-fields/operation-fields-contract';
import { questFieldsContract } from '../../../contracts/quest-fields/quest-fields-contract';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';

const { recipe } = recipesHydrationCreateBroker();

const OPERATIONS_COUNT = 2;
const SEEDED_WORK_ITEM_CREATED_AT = '2024-01-01T00:00:00.000Z';

export const recipesQuestCompletedBroker = recipe(
  {
    name: 'quest-completed',
    description:
      'one guild holding one completed quest with all workflow operations and work items finished',
  },
  () => [
    dmRegistryBroker.guilds.add(1, (g) => [
      g[0].quests.add(1, (q) => [
        q[0].setRaw({
          status: questFieldsContract.shape.status.parse('complete'),
          title: questFieldsContract.shape.title.parse('Verified Flow'),
          workItems: [
            workItemContract.parse({
              id: questWorkItemIdContract.parse('00000000-0000-4000-8000-000000000101'),
              role: 'codeweaver',
              status: 'complete',
              spawnerType: 'agent',
              createdAt: SEEDED_WORK_ITEM_CREATED_AT,
            }),
            workItemContract.parse({
              id: questWorkItemIdContract.parse('00000000-0000-4000-8000-000000000102'),
              role: 'ward',
              status: 'complete',
              spawnerType: 'command',
              createdAt: SEEDED_WORK_ITEM_CREATED_AT,
            }),
          ],
        }),
        q[0].operations.add(OPERATIONS_COUNT, (o) => [
          o[0].set({
            role: operationFieldsContract.shape.role.parse('codeweaver'),
            status: operationFieldsContract.shape.status.parse('complete'),
          }),
          o[1].set({
            role: operationFieldsContract.shape.role.parse('ward'),
            status: operationFieldsContract.shape.status.parse('complete'),
          }),
        ]),
        q[0].saveRecordAs({ name: 'quest' }),
      ]),
      g[0].saveRecordAs({ name: 'guild' }),
    ]),
  ],
);
