/**
 * PURPOSE: The `quest-completed` recipe — one guild holding one completed quest with all workflow
 * operations AND work items finished, each work item's `relatedDataItems` naming the operation
 * whose scope it worked. Reach for this over other recipes when testing completed quest outcomes
 * and ledger verification.
 *
 * `status`/`title` ride the create-time `setRaw()` right after `add()`, before the row has a route
 * call of its own — `questWriteRouteBroker`'s own header names this exact case. Operations mint
 * through the real `operation` ingredient's `.add()` (its `write` route IS
 * `questOperationsUpdateBroker`'s own effect, re-read fresh and appended — see
 * `operation-write-route-broker.ts`), each `saveRecordAs`-ed under its own name. Each work item
 * then links to its operation's REAL, run-time-minted id via `q[0].attachWorkItem`'s `operationId`
 * argument: `fromSavedRefTransformer({name, field: 'id'})` names the sibling operation by the same
 * name it was saved under, and `opExtraApplyLayerBroker` resolves that reference against
 * `state.saved` before `questWorkItemAttachBroker` ever runs — no fixed-literal operation id
 * anywhere in this file.
 *
 * `attachWorkItem` exists because `workItems` sits on NO status's
 * `questStatusInputAllowlistStatics` entry (`quest-ingredient-broker.ts`'s own header), so a plain
 * `q[0].set({workItems: [...]})` AFTER create would be refused by `questModifyBroker` at every
 * status — `packages/hydration-recipes/CLAUDE.md`'s "Two known gaps" bullet on this named the gap;
 * `quest-work-item-attach-broker.ts` closes it the same way `operationWriteRouteBroker` bypasses
 * the identical gate for `operations`.
 *
 * The work-item ids and `createdAt` below are still fixed literals / server-minted, never
 * `Date.now()`/`crypto.randomUUID()` called from THIS file: a recipe's plan is data assembled once
 * at build time (`packages/hydration/CLAUDE.md`, "A plan is DATA"), so two BUILDS of this same plan
 * stay byte-identical — the ids that vary are minted by the ROUTES/EXTRAS at RUN time, same as
 * `operationWriteRouteBroker` already did for `operations`.
 *
 * USAGE:
 * const plan = recipesQuestCompletedBroker();
 * const result = await dmRegistryBroker.run(plan, target);
 */

import { fieldNameContract, savedRecordNameContract } from '@dungeonmaster/hydration/contracts';
import { fromSavedRefTransformer } from '@dungeonmaster/hydration/transformers';

import { operationFieldsContract } from '../../../contracts/operation-fields/operation-fields-contract';
import { questFieldsContract } from '../../../contracts/quest-fields/quest-fields-contract';
import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';

const { recipe } = recipesHydrationCreateBroker();

const SEEDED_WORK_ITEM_CREATED_AT = '2024-01-01T00:00:00.000Z';
const CODEWEAVER_OPERATION_SAVED_NAME = savedRecordNameContract.parse('codeweaverOperation');
const WARD_OPERATION_SAVED_NAME = savedRecordNameContract.parse('wardOperation');
const OPERATION_ID_FIELD = fieldNameContract.parse('id');
const OPERATION_COUNT = 2;

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
        }),
        q[0].operations.add(OPERATION_COUNT, (ops) => [
          ops[0].setRaw({
            role: 'codeweaver',
            text: operationFieldsContract.shape.text.parse('Seeded codeweaver operation'),
            status: 'complete',
          }),
          ops[0].saveRecordAs({ name: CODEWEAVER_OPERATION_SAVED_NAME }),
          ops[1].setRaw({
            role: 'ward',
            text: operationFieldsContract.shape.text.parse('Seeded ward operation'),
            status: 'complete',
          }),
          ops[1].saveRecordAs({ name: WARD_OPERATION_SAVED_NAME }),
        ]),
        q[0].attachWorkItem({
          role: 'codeweaver',
          status: 'complete',
          spawnerType: 'agent',
          createdAt: SEEDED_WORK_ITEM_CREATED_AT,
          operationId: fromSavedRefTransformer({
            name: CODEWEAVER_OPERATION_SAVED_NAME,
            field: OPERATION_ID_FIELD,
          }),
        }),
        q[0].attachWorkItem({
          role: 'ward',
          status: 'complete',
          spawnerType: 'command',
          createdAt: SEEDED_WORK_ITEM_CREATED_AT,
          operationId: fromSavedRefTransformer({
            name: WARD_OPERATION_SAVED_NAME,
            field: OPERATION_ID_FIELD,
          }),
        }),
        q[0].saveRecordAs({ name: 'quest' }),
      ]),
      g[0].saveRecordAs({ name: 'guild' }),
    ]),
  ],
);
