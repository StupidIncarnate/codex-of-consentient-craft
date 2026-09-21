import {
  FilePathStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { workItemPatchLayerBroker } from './work-item-patch-layer-broker';
import { workItemPatchLayerBrokerProxy } from './work-item-patch-layer-broker.proxy';

const QUEST_ID = QuestIdStub({ value: 'add-auth' });
const WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' });
const OTHER_WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' });
const QUEST_FILE_PATH = FilePathStub({ value: '/home/testuser/.dungeonmaster/quest.json' });
const NOW_AT = '2026-01-15T10:00:00.000Z';

describe('workItemPatchLayerBroker', () => {
  it('VALID: {patch: {declaredWord, declaredReason}} => persists the quest with only the addressed work item changed, updatedAt bumped', async () => {
    const proxy = workItemPatchLayerBrokerProxy();
    const targetWorkItem = WorkItemStub({ id: WORK_ITEM_ID, role: 'codeweaver' });
    const otherWorkItem = WorkItemStub({ id: OTHER_WORK_ITEM_ID, role: 'flowrider' });
    const quest = QuestStub({
      id: QUEST_ID,
      workItems: [targetWorkItem, otherWorkItem],
      updatedAt: '2020-01-01T00:00:00.000Z',
    });

    const result = await workItemPatchLayerBroker({
      quest,
      questFilePath: QUEST_FILE_PATH,
      questId: QUEST_ID,
      workItemId: WORK_ITEM_ID,
      patch: { declaredWord: 'done', declaredReason: 'every unit is met' as never },
      nowAt: NOW_AT as never,
    });

    expect(result).toStrictEqual({
      ...targetWorkItem,
      declaredWord: 'done',
      declaredReason: 'every unit is met',
    });

    const [persisted] = proxy.getPersistedQuests();
    const { workItems, updatedAt } = persisted as ReturnType<typeof QuestStub>;

    expect(updatedAt).toBe(NOW_AT);
    expect(workItems).toStrictEqual([
      { ...targetWorkItem, declaredWord: 'done', declaredReason: 'every unit is met' },
      otherWorkItem,
    ]);
  });

  it('ERROR: {workItemId not on the quest} => throws naming it, persists nothing', async () => {
    workItemPatchLayerBrokerProxy();
    const quest = QuestStub({ id: QUEST_ID, workItems: [] });

    await expect(
      workItemPatchLayerBroker({
        quest,
        questFilePath: QUEST_FILE_PATH,
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        patch: { declaredWord: 'done' },
        nowAt: NOW_AT as never,
      }),
    ).rejects.toThrow(
      /^workItemPatchLayerBroker: work item aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa is not on quest add-auth — nothing was patched$/u,
    );
  });
});
