import { StepNameStub } from '@dungeonmaster/shared/contracts';

import { orchestratorQuestWorkAdapter } from './orchestrator-quest-work-adapter';
import { orchestratorQuestWorkAdapterProxy } from './orchestrator-quest-work-adapter.proxy';

const QUEST_ID = 'add-auth';
const WORK_ITEM_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

describe('orchestratorQuestWorkAdapter', () => {
  describe('a successful call', () => {
    it('VALID: {questId, workItemId, payload} => returns the wrapped result', async () => {
      const proxy = orchestratorQuestWorkAdapterProxy();
      proxy.returns({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        result: { kind: 'outcome', word: 'done' },
      });

      const result = await orchestratorQuestWorkAdapter({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        payload: { kind: 'outcome', word: 'done', reason: 'every assigned unit is met' },
      });

      expect(result).toStrictEqual({ kind: 'outcome', word: 'done' });
    });

    it('VALID: {payload} => forwards questId, workItemId and payload unchanged', async () => {
      const proxy = orchestratorQuestWorkAdapterProxy();
      proxy.returns({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        result: { kind: 'request', step: StepNameStub({ value: 'recipe' }) },
      });

      await orchestratorQuestWorkAdapter({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        payload: { kind: 'request', step: 'recipe', reason: 'the seed is missing' },
      });

      expect(
        proxy.getLastCalledInputFor({ questId: QUEST_ID, workItemId: WORK_ITEM_ID }),
      ).toStrictEqual({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        payload: { kind: 'request', step: 'recipe', reason: 'the seed is missing' },
      });
    });
  });

  describe('a refusal', () => {
    it('ERROR: {the orchestrator throws} => rejects with the same error', async () => {
      const proxy = orchestratorQuestWorkAdapterProxy();
      proxy.throws({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        error: new Error('quest-work: work item not on quest — nothing was recorded'),
      });

      await expect(
        orchestratorQuestWorkAdapter({
          questId: QUEST_ID,
          workItemId: WORK_ITEM_ID,
          payload: { kind: 'outcome', word: 'done', reason: 'ok' },
        }),
      ).rejects.toThrow(/quest-work: work item not on quest/u);
    });
  });
});
