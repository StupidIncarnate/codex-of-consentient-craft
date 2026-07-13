import {
  ExitCodeStub,
  FileContentsStub,
  FileNameStub,
  OperationItemStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WardResultStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { questRunWardBroker } from './quest-run-ward-broker';
import { questRunWardBrokerProxy } from './quest-run-ward-broker.proxy';

// The proxy pins crypto.randomUUID to a deterministic sequence: call #0 = wardResultId,
// then every later call (spiritmender operation id, ward-continuation operation id, advance's
// new work-item id) gets the next sequenced UUID.
const WARD_RESULT_ID = 'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f0f0';
const SECOND_UUID = 'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f001';
const THIRD_UUID = 'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f002';
const FOURTH_UUID = 'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f003';

const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';

// Virtual-fs constants baked into the proxy's quest-file store.
const GUILD_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const QUEST_FOLDER_PATH = `/home/testuser/.dungeonmaster/guilds/${GUILD_ID}/quests/001-add-auth`;

const WARD_OP_ID = '11111111-1111-4111-8111-111111111111';
const FLOWRIDER_OP_ID = '22222222-2222-4222-8222-222222222222';
const WARD_WORK_ITEM_ID = 'a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5';
const PENDING_WORK_ITEM_ID = 'b2b2b2b2-c3c3-d4d4-e5e5-f6f6f6f6f6f6';

const WARD_DETAIL_JSON = '{"checks":[]}';

describe('questRunWardBroker', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(questRunWardBroker).toStrictEqual(expect.any(Function));
    });
  });

  describe('GREEN — exit 0', () => {
    it('VALID: {exitCode 0, runId, mode: changed} => wardResult appended, ward work item + operation complete, advance creates the flowrider work item (never another ward)', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: WARD_WORK_ITEM_ID });
      const runId = FileNameStub({ value: '1739625600000-a3f1' });
      const wardOp = OperationItemStub({
        id: WARD_OP_ID,
        role: 'ward',
        text: 'verify build (changed)',
        status: 'in_progress',
        locked: true,
        wardMode: 'changed',
      });
      const flowriderOp = OperationItemStub({
        id: FLOWRIDER_OP_ID,
        role: 'flowrider',
        text: 'flow: login',
        status: 'pending',
      });
      const wardItem = WorkItemStub({
        id: workItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        relatedDataItems: [`operations/${WARD_OP_ID}`],
        wardMode: 'changed',
      });
      const proxy = questRunWardBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [wardOp, flowriderOp],
          workItems: [wardItem],
        }),
      });
      proxy.wardExits({
        exitCode: ExitCodeStub({ value: 0 }),
        runId,
        detailJson: FileContentsStub({ value: WARD_DETAIL_JSON }),
      });

      const result = await questRunWardBroker({ questId, workItemId, mode: 'changed' });

      expect(result).toStrictEqual({
        success: true,
        questId,
        workItemId,
        exitCode: ExitCodeStub({ value: 0 }),
        wardResultId: WARD_RESULT_ID,
        lastWardRunId: runId,
      });
      expect(proxy.getSpawnedWardArgs()).toStrictEqual(['run', '--changed']);
      expect(proxy.getPersistedQuest()).toStrictEqual(
        QuestStub({
          id: questId,
          status: 'in_progress',
          updatedAt: FIXED_TIMESTAMP,
          operations: [
            OperationItemStub({ ...wardOp, status: 'complete' }),
            OperationItemStub({ ...flowriderOp, status: 'in_progress' }),
          ],
          workItems: [
            WorkItemStub({
              id: workItemId,
              role: 'ward',
              status: 'complete',
              spawnerType: 'command',
              relatedDataItems: [`operations/${WARD_OP_ID}`, `wardResults/${WARD_RESULT_ID}`],
              wardMode: 'changed',
              completedAt: FIXED_TIMESTAMP,
              lastWardRunId: runId,
            }),
            WorkItemStub({
              id: SECOND_UUID,
              role: 'flowrider',
              status: 'pending',
              spawnerType: 'agent',
              relatedDataItems: [`operations/${FLOWRIDER_OP_ID}`],
              dependsOn: [workItemId],
              createdAt: FIXED_TIMESTAMP,
            }),
          ],
          wardResults: [
            WardResultStub({
              id: WARD_RESULT_ID,
              createdAt: FIXED_TIMESTAMP,
              exitCode: 0,
              runId: '1739625600000-a3f1',
              wardMode: 'changed',
            }),
          ],
        }),
      );
    });

    it('VALID: {exitCode 0, mode: full} => spawns [run] and stamps wardMode full on the wardResult', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: WARD_WORK_ITEM_ID });
      const runId = FileNameStub({ value: '1739625600000-bbbb' });
      const wardOp = OperationItemStub({
        id: WARD_OP_ID,
        role: 'ward',
        text: 'verify build (full)',
        status: 'in_progress',
        locked: true,
        wardMode: 'full',
      });
      const wardItem = WorkItemStub({
        id: workItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        relatedDataItems: [`operations/${WARD_OP_ID}`],
        wardMode: 'full',
      });
      const proxy = questRunWardBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [wardOp],
          workItems: [wardItem],
        }),
      });
      proxy.wardExits({
        exitCode: ExitCodeStub({ value: 0 }),
        runId,
        detailJson: FileContentsStub({ value: WARD_DETAIL_JSON }),
      });

      await questRunWardBroker({ questId, workItemId, mode: 'full' });

      expect(proxy.getSpawnedWardArgs()).toStrictEqual(['run']);
      expect(proxy.getPersistedQuest()).toStrictEqual(
        QuestStub({
          id: questId,
          // Last operation completed green — the ledger is drained, so the derive flips complete.
          status: 'complete',
          updatedAt: FIXED_TIMESTAMP,
          operations: [OperationItemStub({ ...wardOp, status: 'complete' })],
          workItems: [
            WorkItemStub({
              id: workItemId,
              role: 'ward',
              status: 'complete',
              spawnerType: 'command',
              relatedDataItems: [`operations/${WARD_OP_ID}`, `wardResults/${WARD_RESULT_ID}`],
              wardMode: 'full',
              completedAt: FIXED_TIMESTAMP,
              lastWardRunId: runId,
            }),
          ],
          wardResults: [
            WardResultStub({
              id: WARD_RESULT_ID,
              createdAt: FIXED_TIMESTAMP,
              exitCode: 0,
              runId: '1739625600000-bbbb',
              wardMode: 'full',
            }),
          ],
        }),
      );
    });
  });

  describe('RED — non-zero exit', () => {
    it('VALID: {exitCode 1, runId} => ward item failed with ward_failed; spiritmender + pt-2 ward continuation inserted after the ward operation; advance dispatches the spiritmender', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: WARD_WORK_ITEM_ID });
      const runId = FileNameStub({ value: '1739625600000-cccc' });
      const wardOp = OperationItemStub({
        id: WARD_OP_ID,
        role: 'ward',
        text: 'verify build (changed)',
        status: 'in_progress',
        locked: true,
        wardMode: 'changed',
      });
      const flowriderOp = OperationItemStub({
        id: FLOWRIDER_OP_ID,
        role: 'flowrider',
        text: 'flow: login',
        status: 'pending',
      });
      const wardItem = WorkItemStub({
        id: workItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        relatedDataItems: [`operations/${WARD_OP_ID}`],
        wardMode: 'changed',
      });
      const proxy = questRunWardBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [wardOp, flowriderOp],
          workItems: [wardItem],
        }),
      });
      proxy.wardExits({
        exitCode: ExitCodeStub({ value: 1 }),
        runId,
        detailJson: FileContentsStub({ value: WARD_DETAIL_JSON }),
      });

      await questRunWardBroker({ questId, workItemId, mode: 'changed' });

      expect(proxy.getPersistedQuest()).toStrictEqual(
        QuestStub({
          id: questId,
          // RED never blocks while chain budget remains — the fix loop keeps the quest running.
          status: 'in_progress',
          updatedAt: FIXED_TIMESTAMP,
          operations: [
            OperationItemStub({ ...wardOp, status: 'complete' }),
            OperationItemStub({
              id: SECOND_UUID,
              role: 'spiritmender',
              text: `Spiritmender: fix ward (changed) failures — wardResult ${WARD_RESULT_ID}`,
              status: 'in_progress',
              locked: true,
            }),
            OperationItemStub({
              id: THIRD_UUID,
              role: 'ward',
              text: 'pt 2: verify build (changed)',
              status: 'pending',
              locked: true,
              wardMode: 'changed',
            }),
            flowriderOp,
          ],
          workItems: [
            WorkItemStub({
              id: workItemId,
              role: 'ward',
              status: 'failed',
              spawnerType: 'command',
              relatedDataItems: [`operations/${WARD_OP_ID}`, `wardResults/${WARD_RESULT_ID}`],
              wardMode: 'changed',
              completedAt: FIXED_TIMESTAMP,
              lastWardRunId: runId,
              errorMessage: 'ward_failed',
            }),
            WorkItemStub({
              id: FOURTH_UUID,
              role: 'spiritmender',
              status: 'pending',
              spawnerType: 'agent',
              relatedDataItems: [`operations/${SECOND_UUID}`],
              dependsOn: [workItemId],
              createdAt: FIXED_TIMESTAMP,
            }),
          ],
          wardResults: [
            WardResultStub({
              id: WARD_RESULT_ID,
              createdAt: FIXED_TIMESTAMP,
              exitCode: 1,
              runId: '1739625600000-cccc',
              wardMode: 'changed',
            }),
          ],
        }),
      );
    });

    it('VALID: {exitCode 1, runId} => returns the parsed result with exit code, wardResultId and lastWardRunId', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: WARD_WORK_ITEM_ID });
      const runId = FileNameStub({ value: '1739625600000-dddd' });
      const wardOp = OperationItemStub({
        id: WARD_OP_ID,
        role: 'ward',
        text: 'verify build (changed)',
        status: 'in_progress',
        locked: true,
        wardMode: 'changed',
      });
      const wardItem = WorkItemStub({
        id: workItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        relatedDataItems: [`operations/${WARD_OP_ID}`],
        wardMode: 'changed',
      });
      const proxy = questRunWardBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [wardOp],
          workItems: [wardItem],
        }),
      });
      proxy.wardExits({
        exitCode: ExitCodeStub({ value: 1 }),
        runId,
        detailJson: FileContentsStub({ value: WARD_DETAIL_JSON }),
      });

      const result = await questRunWardBroker({ questId, workItemId, mode: 'changed' });

      expect(result).toStrictEqual({
        success: true,
        questId,
        workItemId,
        exitCode: ExitCodeStub({ value: 1 }),
        wardResultId: WARD_RESULT_ID,
        lastWardRunId: runId,
      });
    });
  });

  describe('RED — chain at budget', () => {
    it('VALID: {maxRetries red ward operations of this wardMode since last green} => no spiritmender/ward appended; quest blocked and pending items skipped', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: WARD_WORK_ITEM_ID });
      const runId = FileNameStub({ value: '1739625600000-eeee' });
      // The failing ward is chain member #maxRetries of the changed-mode chain: every earlier
      // chain member's linked ward work item FAILED (no green ward resets the count).
      const priorRedOps = Array.from(
        { length: slotManagerStatics.ward.maxRetries - 1 },
        (_, index) =>
          OperationItemStub({
            id: `cccccccc-0000-4000-8000-00000000000${index}`,
            role: 'ward',
            text: 'verify build (changed)',
            status: 'complete',
            locked: true,
            wardMode: 'changed',
          }),
      );
      const priorRedItems = priorRedOps.map((operation, index) =>
        WorkItemStub({
          id: `dddddddd-0000-4000-8000-00000000000${index}`,
          role: 'ward',
          status: 'failed',
          spawnerType: 'command',
          relatedDataItems: [`operations/${String(operation.id)}`],
          wardMode: 'changed',
        }),
      );
      const activeWardOp = OperationItemStub({
        id: WARD_OP_ID,
        role: 'ward',
        text: 'verify build (changed)',
        status: 'in_progress',
        locked: true,
        wardMode: 'changed',
      });
      const flowriderOp = OperationItemStub({
        id: FLOWRIDER_OP_ID,
        role: 'flowrider',
        text: 'flow: login',
        status: 'pending',
      });
      const wardItem = WorkItemStub({
        id: workItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        relatedDataItems: [`operations/${WARD_OP_ID}`],
        wardMode: 'changed',
      });
      const pendingItem = WorkItemStub({
        id: PENDING_WORK_ITEM_ID,
        role: 'flowrider',
        status: 'pending',
        spawnerType: 'agent',
        relatedDataItems: [`operations/${FLOWRIDER_OP_ID}`],
        dependsOn: [workItemId],
      });
      const proxy = questRunWardBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [...priorRedOps, activeWardOp, flowriderOp],
          workItems: [...priorRedItems, wardItem, pendingItem],
        }),
      });
      proxy.wardExits({
        exitCode: ExitCodeStub({ value: 1 }),
        runId,
        detailJson: FileContentsStub({ value: WARD_DETAIL_JSON }),
      });

      await questRunWardBroker({ questId, workItemId, mode: 'changed' });

      expect(proxy.getPersistedQuest()).toStrictEqual(
        QuestStub({
          id: questId,
          status: 'blocked',
          updatedAt: FIXED_TIMESTAMP,
          // The ledger is untouched beyond completing the ward operation — no fresh fix loop.
          operations: [
            ...priorRedOps,
            OperationItemStub({ ...activeWardOp, status: 'complete' }),
            flowriderOp,
          ],
          workItems: [
            ...priorRedItems,
            WorkItemStub({
              id: workItemId,
              role: 'ward',
              status: 'failed',
              spawnerType: 'command',
              relatedDataItems: [`operations/${WARD_OP_ID}`, `wardResults/${WARD_RESULT_ID}`],
              wardMode: 'changed',
              completedAt: FIXED_TIMESTAMP,
              lastWardRunId: runId,
              errorMessage: 'ward_failed',
            }),
            WorkItemStub({ ...pendingItem, status: 'skipped' }),
          ],
          wardResults: [
            WardResultStub({
              id: WARD_RESULT_ID,
              createdAt: FIXED_TIMESTAMP,
              exitCode: 1,
              runId: '1739625600000-eeee',
              wardMode: 'changed',
            }),
          ],
        }),
      );
    });
  });

  describe('RED — chain respects wardMode boundaries', () => {
    it('VALID: {maxRetries red full-mode ward operations, changed-mode ward fails} => full ops do not count; spiritmender + continuation still spliced', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: WARD_WORK_ITEM_ID });
      const runId = FileNameStub({ value: '1739625600000-ffff' });
      const priorFullOps = Array.from({ length: slotManagerStatics.ward.maxRetries }, (_, index) =>
        OperationItemStub({
          id: `cccccccc-0000-4000-8000-00000000000${index}`,
          role: 'ward',
          text: 'verify build (full)',
          status: 'complete',
          locked: true,
          wardMode: 'full',
        }),
      );
      const priorFullItems = priorFullOps.map((operation, index) =>
        WorkItemStub({
          id: `dddddddd-0000-4000-8000-00000000000${index}`,
          role: 'ward',
          status: 'failed',
          spawnerType: 'command',
          relatedDataItems: [`operations/${String(operation.id)}`],
          wardMode: 'full',
        }),
      );
      const activeWardOp = OperationItemStub({
        id: WARD_OP_ID,
        role: 'ward',
        text: 'verify build (changed)',
        status: 'in_progress',
        locked: true,
        wardMode: 'changed',
      });
      const wardItem = WorkItemStub({
        id: workItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        relatedDataItems: [`operations/${WARD_OP_ID}`],
        wardMode: 'changed',
      });
      const proxy = questRunWardBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [...priorFullOps, activeWardOp],
          workItems: [...priorFullItems, wardItem],
        }),
      });
      proxy.wardExits({
        exitCode: ExitCodeStub({ value: 1 }),
        runId,
        detailJson: FileContentsStub({ value: WARD_DETAIL_JSON }),
      });

      await questRunWardBroker({ questId, workItemId, mode: 'changed' });

      expect(proxy.getPersistedQuest()).toStrictEqual(
        QuestStub({
          id: questId,
          status: 'in_progress',
          updatedAt: FIXED_TIMESTAMP,
          operations: [
            ...priorFullOps,
            OperationItemStub({ ...activeWardOp, status: 'complete' }),
            OperationItemStub({
              id: SECOND_UUID,
              role: 'spiritmender',
              text: `Spiritmender: fix ward (changed) failures — wardResult ${WARD_RESULT_ID}`,
              status: 'in_progress',
              locked: true,
            }),
            OperationItemStub({
              id: THIRD_UUID,
              role: 'ward',
              text: 'pt 2: verify build (changed)',
              status: 'pending',
              locked: true,
              wardMode: 'changed',
            }),
          ],
          workItems: [
            ...priorFullItems,
            WorkItemStub({
              id: workItemId,
              role: 'ward',
              status: 'failed',
              spawnerType: 'command',
              relatedDataItems: [`operations/${WARD_OP_ID}`, `wardResults/${WARD_RESULT_ID}`],
              wardMode: 'changed',
              completedAt: FIXED_TIMESTAMP,
              lastWardRunId: runId,
              errorMessage: 'ward_failed',
            }),
            WorkItemStub({
              id: FOURTH_UUID,
              role: 'spiritmender',
              status: 'pending',
              spawnerType: 'agent',
              relatedDataItems: [`operations/${SECOND_UUID}`],
              dependsOn: [workItemId],
              createdAt: FIXED_TIMESTAMP,
            }),
          ],
          wardResults: [
            WardResultStub({
              id: WARD_RESULT_ID,
              createdAt: FIXED_TIMESTAMP,
              exitCode: 1,
              runId: '1739625600000-ffff',
              wardMode: 'changed',
            }),
          ],
        }),
      );
    });
  });

  describe('ward work item missing', () => {
    it('EMPTY: {workItemId not on quest} => ledger and work items untouched; wardResult still persisted and result returned', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: WARD_WORK_ITEM_ID });
      const runId = FileNameStub({ value: '1739625600000-abcd' });
      const wardOp = OperationItemStub({
        id: WARD_OP_ID,
        role: 'ward',
        text: 'verify build (changed)',
        status: 'complete',
        locked: true,
        wardMode: 'changed',
      });
      const proxy = questRunWardBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [wardOp],
          workItems: [],
        }),
      });
      proxy.wardExits({
        exitCode: ExitCodeStub({ value: 0 }),
        runId,
        detailJson: FileContentsStub({ value: WARD_DETAIL_JSON }),
      });

      const result = await questRunWardBroker({ questId, workItemId, mode: 'changed' });

      expect(result).toStrictEqual({
        success: true,
        questId,
        workItemId,
        exitCode: ExitCodeStub({ value: 0 }),
        wardResultId: WARD_RESULT_ID,
        lastWardRunId: runId,
      });
      expect(proxy.getPersistedQuest()).toStrictEqual(
        QuestStub({
          id: questId,
          status: 'in_progress',
          updatedAt: FIXED_TIMESTAMP,
          operations: [wardOp],
          workItems: [],
          wardResults: [
            WardResultStub({
              id: WARD_RESULT_ID,
              createdAt: FIXED_TIMESTAMP,
              exitCode: 0,
              runId: '1739625600000-abcd',
              wardMode: 'changed',
            }),
          ],
        }),
      );
    });
  });

  describe('ward detail blob', () => {
    it('VALID: {runId parsed} => detail JSON written to ward-results/<wardResultId>.json under the quest folder', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: WARD_WORK_ITEM_ID });
      const runId = FileNameStub({ value: '1739625600000-a3f1' });
      const wardOp = OperationItemStub({
        id: WARD_OP_ID,
        role: 'ward',
        text: 'verify build (changed)',
        status: 'in_progress',
        locked: true,
        wardMode: 'changed',
      });
      const wardItem = WorkItemStub({
        id: workItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        relatedDataItems: [`operations/${WARD_OP_ID}`],
        wardMode: 'changed',
      });
      const proxy = questRunWardBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [wardOp],
          workItems: [wardItem],
        }),
      });
      proxy.wardExits({
        exitCode: ExitCodeStub({ value: 0 }),
        runId,
        detailJson: FileContentsStub({ value: WARD_DETAIL_JSON }),
      });

      await questRunWardBroker({ questId, workItemId, mode: 'changed' });

      expect(proxy.getMkdirPaths()).toStrictEqual([`${QUEST_FOLDER_PATH}/ward-results`]);
      expect(proxy.getDetailWrites()).toStrictEqual([
        {
          path: `${QUEST_FOLDER_PATH}/ward-results/${WARD_RESULT_ID}.json`,
          contents: WARD_DETAIL_JSON,
        },
      ]);
    });

    it('EMPTY: {no runId in ward output} => no detail write; wardResult, work item and result carry no runId', async () => {
      const questId = QuestIdStub();
      const workItemId = QuestWorkItemIdStub({ value: WARD_WORK_ITEM_ID });
      const wardOp = OperationItemStub({
        id: WARD_OP_ID,
        role: 'ward',
        text: 'verify build (changed)',
        status: 'in_progress',
        locked: true,
        wardMode: 'changed',
      });
      const wardItem = WorkItemStub({
        id: workItemId,
        role: 'ward',
        status: 'in_progress',
        spawnerType: 'command',
        relatedDataItems: [`operations/${WARD_OP_ID}`],
        wardMode: 'changed',
      });
      const proxy = questRunWardBrokerProxy();
      proxy.setupQuest({
        quest: QuestStub({
          id: questId,
          status: 'in_progress',
          operations: [wardOp],
          workItems: [wardItem],
        }),
      });
      proxy.wardExitsWithoutRunId({ exitCode: ExitCodeStub({ value: 0 }) });

      const result = await questRunWardBroker({ questId, workItemId, mode: 'changed' });

      expect(result).toStrictEqual({
        success: true,
        questId,
        workItemId,
        exitCode: ExitCodeStub({ value: 0 }),
        wardResultId: WARD_RESULT_ID,
      });
      expect(proxy.getMkdirPaths()).toStrictEqual([]);
      expect(proxy.getDetailWrites()).toStrictEqual([]);
      expect(proxy.getPersistedQuest()).toStrictEqual(
        QuestStub({
          id: questId,
          // The only operation completed green — the ledger is drained, so the derive flips
          // complete.
          status: 'complete',
          updatedAt: FIXED_TIMESTAMP,
          operations: [OperationItemStub({ ...wardOp, status: 'complete' })],
          workItems: [
            WorkItemStub({
              id: workItemId,
              role: 'ward',
              status: 'complete',
              spawnerType: 'command',
              relatedDataItems: [`operations/${WARD_OP_ID}`, `wardResults/${WARD_RESULT_ID}`],
              wardMode: 'changed',
              completedAt: FIXED_TIMESTAMP,
            }),
          ],
          wardResults: [
            WardResultStub({
              id: WARD_RESULT_ID,
              createdAt: FIXED_TIMESTAMP,
              exitCode: 0,
              wardMode: 'changed',
            }),
          ],
        }),
      );
    });
  });
});
