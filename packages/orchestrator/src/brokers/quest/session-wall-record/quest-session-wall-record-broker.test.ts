import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

import { questSessionWallRecordBroker } from './quest-session-wall-record-broker';
import { questSessionWallRecordBrokerProxy } from './quest-session-wall-record-broker.proxy';

const WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
const REASON = 'the dungeonmaster MCP server did not connect in this session (status: failed)';

describe('questSessionWallRecordBroker', () => {
  it('VALID: {in_progress session item} => marks it failed, carrying wall and the reason as declaredReason and errorMessage', async () => {
    const proxy = questSessionWallRecordBrokerProxy();
    const quest = QuestStub({
      workItems: [WorkItemStub({ id: WORK_ITEM_ID, role: 'spiritmender', status: 'in_progress' })],
    });
    proxy.setupQuest({ quest });

    await questSessionWallRecordBroker({
      questId: quest.id,
      workItemId: WORK_ITEM_ID,
      reason: REASON,
    });

    const recorded = proxy.getAllPersistedQuests().map((persisted) =>
      persisted.workItems.map((item) => ({
        status: item.status,
        declaredWord: item.declaredWord,
        declaredReason: String(item.declaredReason),
        errorMessage: String(item.errorMessage),
        hasCompletedAt: typeof item.completedAt === 'string',
      })),
    );

    expect(recorded).toStrictEqual([
      [
        {
          status: 'failed',
          declaredWord: 'wall',
          declaredReason: REASON,
          errorMessage: REASON,
          hasCompletedAt: true,
        },
      ],
    ]);
  });

  it('VALID: {item already complete} => writes nothing, so a session that did signal keeps its own record', async () => {
    const proxy = questSessionWallRecordBrokerProxy();
    const quest = QuestStub({
      workItems: [WorkItemStub({ id: WORK_ITEM_ID, role: 'spiritmender', status: 'complete' })],
    });
    proxy.setupQuest({ quest });

    await questSessionWallRecordBroker({
      questId: quest.id,
      workItemId: WORK_ITEM_ID,
      reason: REASON,
    });

    expect(proxy.getAllPersistedQuests()).toStrictEqual([]);
  });

  it('EMPTY: {work item not on the quest} => writes nothing', async () => {
    const proxy = questSessionWallRecordBrokerProxy();
    const quest = QuestStub({ workItems: [] });
    proxy.setupQuest({ quest });

    await questSessionWallRecordBroker({
      questId: quest.id,
      workItemId: WORK_ITEM_ID,
      reason: REASON,
    });

    expect(proxy.getAllPersistedQuests()).toStrictEqual([]);
  });
});
