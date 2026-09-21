import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { GetQuestWorkLayerResponder } from './get-quest-work-layer-responder';
import { GetQuestWorkLayerResponderProxy } from './get-quest-work-layer-responder.proxy';

const QUEST_ID = 'add-auth';
const WORK_ITEM_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const OPERATION_ITEM_ID = 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479';
const PLAN_MARKDOWN = '# Plan for operation item a1b2c3d4\n\n| unit | mark | claimed by |';
const JSON_INDENT = 2;

describe('GetQuestWorkLayerResponder', () => {
  describe('the work-item shape', () => {
    it('VALID: {questId, workItemId} => the view is served as JSON', async () => {
      const proxy = GetQuestWorkLayerResponderProxy();
      const view = proxy.defaultView();
      proxy.setupReturns({ questId: QUEST_ID, result: { view, planText: null } });

      const response = await GetQuestWorkLayerResponder({
        args: { questId: QUEST_ID, workItemId: WORK_ITEM_ID },
      });

      expect(response).toStrictEqual({
        content: [{ type: 'text', text: JSON.stringify(view, null, JSON_INDENT) }],
      });
    });

    it('VALID: {a served view} => `piece` survives serialization as an explicit null', async () => {
      const proxy = GetQuestWorkLayerResponderProxy();
      proxy.setupReturns({
        questId: QUEST_ID,
        result: { view: proxy.defaultView(), planText: null },
      });

      const response = await GetQuestWorkLayerResponder({
        args: { questId: QUEST_ID, workItemId: WORK_ITEM_ID },
      });

      const line = String(response.content[0]?.text)
        .split('\n')
        .find((entry) => entry.trim().startsWith('"piece"'));

      expect(line).toBe('  "piece": null,');
    });
  });

  describe('the operation-item shape', () => {
    it('VALID: {questId, operationItemId} => the markdown is served RAW, with its newlines intact', async () => {
      const proxy = GetQuestWorkLayerResponderProxy();
      proxy.setupReturns({
        questId: QUEST_ID,
        result: { view: null, planText: ContentTextStub({ value: PLAN_MARKDOWN }) },
      });

      const response = await GetQuestWorkLayerResponder({
        args: { questId: QUEST_ID, operationItemId: OPERATION_ITEM_ID },
      });

      expect(response).toStrictEqual({
        content: [{ type: 'text', text: PLAN_MARKDOWN }],
      });
    });
  });

  describe('refusals', () => {
    it('ERROR: {the orchestrator throws} => the message rides back under isError', async () => {
      const proxy = GetQuestWorkLayerResponderProxy();
      proxy.setupThrows({
        questId: QUEST_ID,
        error: new Error('get-quest-work: work item is not on quest add-auth'),
      });

      const response = await GetQuestWorkLayerResponder({
        args: { questId: QUEST_ID, workItemId: WORK_ITEM_ID },
      });

      expect(response).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'get-quest-work: work item is not on quest add-auth' },
              null,
              JSON_INDENT,
            ),
          },
        ],
        isError: true,
      });
    });

    it('INVALID: {both ids} => the contract refuses before the orchestrator is reached', async () => {
      GetQuestWorkLayerResponderProxy();

      await expect(
        GetQuestWorkLayerResponder({
          args: {
            questId: QUEST_ID,
            workItemId: WORK_ITEM_ID,
            operationItemId: OPERATION_ITEM_ID,
          },
        }),
      ).rejects.toThrow(/operationItemId cannot be combined with workItemId/u);
    });
  });
});
