import { StepNameStub } from '@dungeonmaster/shared/contracts';

import { QuestWorkLayerResponder } from './quest-work-layer-responder';
import { QuestWorkLayerResponderProxy } from './quest-work-layer-responder.proxy';

const JSON_INDENT_SPACES = 2;
const QUEST_ID = 'add-auth';
const WORK_ITEM_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

describe('QuestWorkLayerResponder', () => {
  describe('a successful call', () => {
    it('VALID: {kind: outcome} => returns the result as JSON', async () => {
      const proxy = QuestWorkLayerResponderProxy();
      proxy.setupReturns({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        result: { kind: 'outcome', word: 'done' },
      });

      const result = await QuestWorkLayerResponder({
        args: {
          questId: QUEST_ID,
          workItemId: WORK_ITEM_ID,
          payload: { kind: 'outcome', word: 'done', reason: 'every assigned unit is met' },
        },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ kind: 'outcome', word: 'done' }, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it('VALID: {kind: request} => forwards questId, workItemId and payload to the adapter', async () => {
      const proxy = QuestWorkLayerResponderProxy();
      proxy.setupReturns({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        result: { kind: 'request', step: StepNameStub({ value: 'recipe' }) },
      });

      await QuestWorkLayerResponder({
        args: {
          questId: QUEST_ID,
          workItemId: WORK_ITEM_ID,
          payload: { kind: 'request', step: 'recipe', reason: 'the seed is missing' },
        },
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

  describe('a refusal — the orchestrator throws, never returns success: false', () => {
    it('ERROR: {the adapter throws} => returns the JSON error shape with isError, the message rides back', async () => {
      const proxy = QuestWorkLayerResponderProxy();
      proxy.setupThrows({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
        error: new Error(
          'quest-work: work item f47ac10b-58cc-4372-a567-0e02b2c3d479 is not on quest add-auth — nothing was recorded',
        ),
      });

      const result = await QuestWorkLayerResponder({
        args: {
          questId: QUEST_ID,
          workItemId: WORK_ITEM_ID,
          payload: { kind: 'outcome', word: 'done', reason: 'ok' },
        },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error:
                  'quest-work: work item f47ac10b-58cc-4372-a567-0e02b2c3d479 is not on quest add-auth — nothing was recorded',
              },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('input validation', () => {
    it('INVALID: {missing workItemId} => throws before any adapter call', async () => {
      QuestWorkLayerResponderProxy();

      await expect(
        QuestWorkLayerResponder({
          args: {
            questId: QUEST_ID,
            payload: { kind: 'outcome', word: 'done', reason: 'ok' },
          },
        }),
      ).rejects.toThrow(/Required/u);
    });

    it("INVALID: {payload.kind: 'signal'} => throws, no seventh branch exists", async () => {
      QuestWorkLayerResponderProxy();

      await expect(
        QuestWorkLayerResponder({
          args: {
            questId: QUEST_ID,
            workItemId: WORK_ITEM_ID,
            payload: { kind: 'signal', reason: 'not a real kind' },
          },
        }),
      ).rejects.toThrow(/invalid/iu);
    });
  });
});
