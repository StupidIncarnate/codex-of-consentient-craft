import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { orchestratorGetQuestWorkAdapter } from './orchestrator-get-quest-work-adapter';
import { orchestratorGetQuestWorkAdapterProxy } from './orchestrator-get-quest-work-adapter.proxy';

const QUEST_ID = 'add-auth';
const WORK_ITEM_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const OPERATION_ITEM_ID = 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479';

describe('orchestratorGetQuestWorkAdapter', () => {
  describe('the work-item shape', () => {
    it('VALID: {questId, workItemId} => returns the view with planText null', async () => {
      const proxy = orchestratorGetQuestWorkAdapterProxy();
      const view = proxy.defaultView();
      proxy.returns({ questId: QUEST_ID, result: { view, planText: null } });

      const result = await orchestratorGetQuestWorkAdapter({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      expect({ workItemId: result.view?.workItemId, planText: result.planText }).toStrictEqual({
        workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        planText: null,
      });
    });

    it('VALID: {questId, workItemId} => forwards exactly those two ids, and no operationItemId key', async () => {
      const proxy = orchestratorGetQuestWorkAdapterProxy();
      proxy.returns({ questId: QUEST_ID, result: { view: proxy.defaultView(), planText: null } });

      await orchestratorGetQuestWorkAdapter({ questId: QUEST_ID, workItemId: WORK_ITEM_ID });

      expect(proxy.getLastCalledInputFor({ questId: QUEST_ID })).toStrictEqual({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });
    });
  });

  describe('the operation-item shape', () => {
    it('VALID: {questId, operationItemId} => returns the markdown with view null', async () => {
      const proxy = orchestratorGetQuestWorkAdapterProxy();
      proxy.returns({
        questId: QUEST_ID,
        result: { view: null, planText: ContentTextStub({ value: '# Plan' }) },
      });

      const result = await orchestratorGetQuestWorkAdapter({
        questId: QUEST_ID,
        operationItemId: OPERATION_ITEM_ID,
      });

      expect({ view: result.view, planText: String(result.planText) }).toStrictEqual({
        view: null,
        planText: '# Plan',
      });
    });

    it('VALID: {questId, operationItemId} => forwards exactly those two ids, and no workItemId key', async () => {
      const proxy = orchestratorGetQuestWorkAdapterProxy();
      proxy.returns({
        questId: QUEST_ID,
        result: { view: null, planText: ContentTextStub({ value: '# Plan' }) },
      });

      await orchestratorGetQuestWorkAdapter({
        questId: QUEST_ID,
        operationItemId: OPERATION_ITEM_ID,
      });

      expect(proxy.getLastCalledInputFor({ questId: QUEST_ID })).toStrictEqual({
        questId: QUEST_ID,
        operationItemId: OPERATION_ITEM_ID,
      });
    });
  });

  describe('a refusal', () => {
    it('ERROR: {the orchestrator throws} => rejects with the same error', async () => {
      const proxy = orchestratorGetQuestWorkAdapterProxy();
      proxy.throws({
        questId: QUEST_ID,
        error: new Error('get-quest-work: work item is not on quest add-auth'),
      });

      await expect(
        orchestratorGetQuestWorkAdapter({ questId: QUEST_ID, workItemId: WORK_ITEM_ID }),
      ).rejects.toThrow(/get-quest-work: work item is not on quest add-auth/u);
    });
  });
});
