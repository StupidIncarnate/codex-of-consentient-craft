/**
 * PURPOSE: The `quest-completed` recipe — one guild holding one completed quest with all workflow
 * operations AND work items finished, each work item's `relatedDataItems` naming the operation
 * whose scope it worked. Reach for this over other recipes when testing completed quest outcomes
 * and ledger verification.
 *
 * `operations` and `workItems` both ride the SAME create-time `setRaw()` that sets
 * `status`/`title` right after `add()`, before the row has a route call of its own —
 * `questWriteRouteBroker`'s own header names this exact case. Neither reaches `questModifyBroker`,
 * whose per-status allowlist (`questStatusInputAllowlistStatics`) refuses both fields at every
 * status — that broker is server-only, reached through advance/signal-back/ward/riftcarver, never
 * through modify-quest. A `set()` placed AFTER this create — on a row that already exists — would
 * go through that gate and be rejected.
 *
 * Operations are fixed literals inside this same `setRaw`, the seeding `quest-advances-one-step`
 * also uses, rather than the `operation` ingredient's own `.add()` route: that route mints its
 * row's id at apply time, and the recipe needs the id already in hand at build time to point each
 * work item's `relatedDataItems` at the right operation.
 *
 * The work-item ids, operation ids and `createdAt` below are fixed literals rather than
 * `crypto.randomUUID()` / `Date.now()`: a recipe's plan is data assembled once at build time
 * (`packages/hydration/CLAUDE.md`, "A plan is DATA"), so two builds of this same plan stay
 * byte-identical.
 *
 * USAGE:
 * const plan = recipesQuestCompletedBroker();
 * const result = await dmRegistryBroker.run(plan, target);
 */

import {
  operationItemContract,
  questWorkItemIdContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';

import { questFieldsContract } from '../../../contracts/quest-fields/quest-fields-contract';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';

const { recipe } = recipesHydrationCreateBroker();

const SEEDED_WORK_ITEM_CREATED_AT = '2024-01-01T00:00:00.000Z';

const CODEWEAVER_OPERATION_ID = operationItemContract.shape.id.parse(
  '00000000-0000-4000-8000-000000000201',
);
const WARD_OPERATION_ID = operationItemContract.shape.id.parse(
  '00000000-0000-4000-8000-000000000202',
);

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
          operations: [
            operationItemContract.parse({
              id: CODEWEAVER_OPERATION_ID,
              role: 'codeweaver',
              text: 'Seeded codeweaver operation',
              status: 'complete',
              locked: false,
              flowIds: [],
              packageNames: [],
            }),
            operationItemContract.parse({
              id: WARD_OPERATION_ID,
              role: 'ward',
              text: 'Seeded ward operation',
              status: 'complete',
              locked: false,
              flowIds: [],
              packageNames: [],
            }),
          ],
          workItems: [
            workItemContract.parse({
              id: questWorkItemIdContract.parse('00000000-0000-4000-8000-000000000101'),
              role: 'codeweaver',
              status: 'complete',
              spawnerType: 'agent',
              createdAt: SEEDED_WORK_ITEM_CREATED_AT,
              relatedDataItems: [`operations/${CODEWEAVER_OPERATION_ID}`],
            }),
            workItemContract.parse({
              id: questWorkItemIdContract.parse('00000000-0000-4000-8000-000000000102'),
              role: 'ward',
              status: 'complete',
              spawnerType: 'command',
              createdAt: SEEDED_WORK_ITEM_CREATED_AT,
              relatedDataItems: [`operations/${WARD_OPERATION_ID}`],
            }),
          ],
        }),
        q[0].saveRecordAs({ name: 'quest' }),
      ]),
      g[0].saveRecordAs({ name: 'guild' }),
    ]),
  ],
);
