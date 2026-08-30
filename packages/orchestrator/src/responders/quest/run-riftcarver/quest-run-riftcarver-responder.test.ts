import {
  OperationItemStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { QuestRunRiftcarverResponderProxy } from './quest-run-riftcarver-responder.proxy';

const CARVE_OP_ID = '11111111-1111-4111-8111-111111111111';
const CARVE_WORK_ITEM_ID = 'a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5';
const CARVE_TEXT = 'Riftcarver: carve the quest branch, worktree and preflight build';

// Virtual-git constants the broker proxy bakes in, restated here so the streamed banners can be
// asserted verbatim rather than by shape.
const BRANCH_NAME = 'quest/add-authentication-add-auth';
const WORKTREE_PATH = '/repo/worktrees/add-authentication-add-auth';
const PACKAGE_WORKTREE_PATH = `${WORKTREE_PATH}/packages/shared`;
const HEAD_SHA = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';

const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';
// The broker proxy pins crypto.randomUUID to a sequence. Each ChatEntry the responder builds takes
// the next id, so the ten carve lines consume ids 0 through 9.
const ENTRY_UUIDS = [
  'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f0f0',
  'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f001',
  'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f002',
  'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f003',
  'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f004',
  'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f005',
  'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f006',
  'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f007',
  'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f008',
  'f0f0f0f0-f0f0-4f0f-bf0f-f0f0f0f0f009',
];

describe('QuestRunRiftcarverResponder', () => {
  it('VALID: {first carve, build passes} => delegates to the broker and returns the full QuestRunRiftcarverResult', async () => {
    const proxy = QuestRunRiftcarverResponderProxy();
    const questId = QuestIdStub();
    const workItemId = QuestWorkItemIdStub({ value: CARVE_WORK_ITEM_ID });

    proxy.setupQuest({
      quest: QuestStub({
        id: questId,
        status: 'in_progress',
        operations: [
          OperationItemStub({
            id: CARVE_OP_ID,
            role: 'riftcarver',
            text: CARVE_TEXT,
            status: 'in_progress',
            locked: true,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: workItemId,
            role: 'riftcarver',
            status: 'pending',
            spawnerType: 'command',
            relatedDataItems: [`operations/${CARVE_OP_ID}`],
          }),
        ],
      }),
    });

    const result = await proxy.callResponder({ questId, workItemId });

    expect(result).toStrictEqual({
      success: true,
      questId,
      workItemId,
      exitCode: 0,
      riftcarverResultId: result.riftcarverResultId,
      outcome: 'green',
    });
  });

  // Riftcarver is `spawnerType: 'command'` with no sessionId, so the JSONL watcher can never tail
  // it. Asserting the exact ChatEntry that reaches the bus for each carve line — not that a
  // callback was handed over — is the only assertion that fails when the stream silently goes dark.
  it('VALID: {carve runs} => every carve line reaches the bus as its own assistant-text ChatEntry, keyed on the carve work item', async () => {
    const proxy = QuestRunRiftcarverResponderProxy();
    const questId = QuestIdStub();
    const workItemId = QuestWorkItemIdStub({ value: CARVE_WORK_ITEM_ID });

    proxy.setupQuest({
      quest: QuestStub({
        id: questId,
        status: 'in_progress',
        operations: [
          OperationItemStub({
            id: CARVE_OP_ID,
            role: 'riftcarver',
            text: CARVE_TEXT,
            status: 'in_progress',
            locked: true,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: workItemId,
            role: 'riftcarver',
            status: 'pending',
            spawnerType: 'command',
            relatedDataItems: [`operations/${CARVE_OP_ID}`],
          }),
        ],
      }),
    });
    const emits = proxy.captureCarveChatEmits();

    await proxy.callResponder({ questId, workItemId });

    expect(emits.getEntries()).toStrictEqual([
      {
        role: 'assistant',
        type: 'text',
        content: '— base branch: main —',
        uuid: ENTRY_UUIDS[0],
        timestamp: FIXED_TIMESTAMP,
      },
      {
        role: 'assistant',
        type: 'text',
        content: `— git worktree add ${WORKTREE_PATH} (branch ${BRANCH_NAME}) —`,
        uuid: ENTRY_UUIDS[1],
        timestamp: FIXED_TIMESTAMP,
      },
      {
        role: 'assistant',
        type: 'text',
        content: `— baseRef ${HEAD_SHA} —`,
        uuid: ENTRY_UUIDS[2],
        timestamp: FIXED_TIMESTAMP,
      },
      // The push rides here, immediately after the git context is recorded and BEFORE the mirror
      // and the build: the branch has to be tracked before the first pass runs, because every
      // `<role>-reviewer` prompt writes a bare `git push` with no `-u` on it.
      {
        role: 'assistant',
        type: 'text',
        content: `— git push -u origin ${BRANCH_NAME} —`,
        uuid: ENTRY_UUIDS[3],
        timestamp: FIXED_TIMESTAMP,
      },
      {
        role: 'assistant',
        type: 'text',
        content: `— mirroring node_modules: ${WORKTREE_PATH} —`,
        uuid: ENTRY_UUIDS[4],
        timestamp: FIXED_TIMESTAMP,
      },
      {
        role: 'assistant',
        type: 'text',
        content: `— mirroring node_modules: ${PACKAGE_WORKTREE_PATH} —`,
        uuid: ENTRY_UUIDS[5],
        timestamp: FIXED_TIMESTAMP,
      },
      {
        role: 'assistant',
        type: 'text',
        content: '— build pass 1/3 —',
        uuid: ENTRY_UUIDS[6],
        timestamp: FIXED_TIMESTAMP,
      },
      {
        role: 'assistant',
        type: 'text',
        content: 'Build succeeded',
        uuid: ENTRY_UUIDS[7],
        timestamp: FIXED_TIMESTAMP,
      },
      {
        role: 'assistant',
        type: 'text',
        content: '— build green on pass 1/3 —',
        uuid: ENTRY_UUIDS[8],
        timestamp: FIXED_TIMESTAMP,
      },
      // The verdict line reaches the bus like any other, so the row a user is watching live carries
      // the outcome without them opening quest.json.
      {
        role: 'assistant',
        type: 'text',
        content: `— CARVED: ${BRANCH_NAME} at ${HEAD_SHA} —`,
        uuid: ENTRY_UUIDS[9],
        timestamp: FIXED_TIMESTAMP,
      },
    ]);
    // One emit per line, each routed to the carve work item — the execution panel groups rows by
    // exactly this id, so a drift here renders the carve output detached from its own row.
    expect(emits.getProcessIds()).toStrictEqual([
      CARVE_WORK_ITEM_ID,
      CARVE_WORK_ITEM_ID,
      CARVE_WORK_ITEM_ID,
      CARVE_WORK_ITEM_ID,
      CARVE_WORK_ITEM_ID,
      CARVE_WORK_ITEM_ID,
      CARVE_WORK_ITEM_ID,
      CARVE_WORK_ITEM_ID,
      CARVE_WORK_ITEM_ID,
      CARVE_WORK_ITEM_ID,
    ]);
  });
});
