import {
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { PromptTextStub } from '../../../contracts/prompt-text/prompt-text.stub';
import { smoketestStampOverrideBroker } from './smoketest-stamp-override-broker';
import { smoketestStampOverrideBrokerProxy } from './smoketest-stamp-override-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

const TARGET_WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' });
const OTHER_WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' });
const QUEST_ID = QuestIdStub({ value: 'stamp-override-quest' });
const OVERRIDE_PROMPT = PromptTextStub({ value: 'You are a test agent. Signal complete.' });

const questWithTargetItem = QuestStub({
  id: QUEST_ID,
  workItems: [
    WorkItemStub({ id: TARGET_WORK_ITEM_ID, role: 'codeweaver', status: 'pending' }),
    WorkItemStub({ id: OTHER_WORK_ITEM_ID, role: 'pathseeker', status: 'complete' }),
  ],
});

const questWithAlreadyStampedItem = QuestStub({
  id: QUEST_ID,
  workItems: [
    WorkItemStub({
      id: TARGET_WORK_ITEM_ID,
      role: 'codeweaver',
      status: 'pending',
      smoketestPromptOverride: PromptTextStub({ value: 'previously stamped prompt' }),
    }),
  ],
});

const questWithoutTargetItem = QuestStub({
  id: QUEST_ID,
  workItems: [WorkItemStub({ id: OTHER_WORK_ITEM_ID, role: 'pathseeker', status: 'complete' })],
});

describe('smoketestStampOverrideBroker', () => {
  describe('successful stamp', () => {
    it('VALID: {work item present, no override yet} => persists updated quest with override on target work item', async () => {
      const proxy = smoketestStampOverrideBrokerProxy();
      proxy.setupQuestFound({ quest: questWithTargetItem });

      const result = await smoketestStampOverrideBroker({
        questId: QUEST_ID,
        workItemId: TARGET_WORK_ITEM_ID,
        override: OVERRIDE_PROMPT,
      });

      const persisted = proxy.getAllPersistedContents();
      const lastWritten = persisted[persisted.length - 1];
      const parsed = JSON.parse(String(lastWritten)) as Quest;
      const targetAfter = parsed.workItems.find((wi) => wi.id === TARGET_WORK_ITEM_ID);
      const otherAfter = parsed.workItems.find((wi) => wi.id === OTHER_WORK_ITEM_ID);

      expect({
        result,
        targetOverride: targetAfter?.smoketestPromptOverride,
        otherOverride: otherAfter?.smoketestPromptOverride,
      }).toStrictEqual({
        result: { success: true },
        targetOverride: OVERRIDE_PROMPT,
        otherOverride: undefined,
      });
    });
  });

  describe('idempotence', () => {
    it('VALID: {work item already stamped} => does not persist and resolves success', async () => {
      const proxy = smoketestStampOverrideBrokerProxy();
      proxy.setupQuestFound({ quest: questWithAlreadyStampedItem });

      const result = await smoketestStampOverrideBroker({
        questId: QUEST_ID,
        workItemId: TARGET_WORK_ITEM_ID,
        override: OVERRIDE_PROMPT,
      });

      expect({
        result,
        persistedCount: proxy.getAllPersistedContents().length,
      }).toStrictEqual({
        result: { success: true },
        persistedCount: 0,
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {work item id not on quest} => throws descriptive error', async () => {
      const proxy = smoketestStampOverrideBrokerProxy();
      proxy.setupQuestFound({ quest: questWithoutTargetItem });

      await expect(
        smoketestStampOverrideBroker({
          questId: QUEST_ID,
          workItemId: TARGET_WORK_ITEM_ID,
          override: OVERRIDE_PROMPT,
        }),
      ).rejects.toThrow(
        /smoketestStampOverrideBroker: work item "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" not found on quest/u,
      );
    });
  });
});
