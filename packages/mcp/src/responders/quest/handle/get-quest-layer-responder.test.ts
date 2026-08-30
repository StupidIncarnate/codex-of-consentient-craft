import { GetQuestResultStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { questToTextDisplayTransformer } from '@dungeonmaster/shared/transformers';

import { GetQuestLayerResponder } from './get-quest-layer-responder';
import { GetQuestLayerResponderProxy } from './get-quest-layer-responder.proxy';

const JSON_INDENT_SPACES = 2;
const FLOW_SLICE = '## Flow: #login-flow — "Log in"';

describe('GetQuestLayerResponder', () => {
  describe('the flow slice', () => {
    // The slice answers BOTH formats. It exists because the whole-quest render is over
    // `mcpToolResultStatics.maxVerbatimChars` on a real quest, and the JSON payload the `json`
    // branch would fall back to is larger still — so honouring the format here would hand back
    // exactly the oversized result the slice was asked for instead of.
    it('VALID: {flowId, format: json} => returns the rendered slice verbatim', async () => {
      const proxy = GetQuestLayerResponderProxy();
      proxy.setupReturns({
        questId: 'add-auth',
        result: GetQuestResultStub({ quest: QuestStub(), flowSlice: FLOW_SLICE }),
      });

      const result = await GetQuestLayerResponder({
        args: { questId: 'add-auth', flowId: 'login-flow', format: 'json' },
      });

      expect(result).toStrictEqual({ content: [{ type: 'text', text: FLOW_SLICE }] });
    });

    it('VALID: {flowId, packageName} => returns the rendered slice verbatim', async () => {
      const proxy = GetQuestLayerResponderProxy();
      proxy.setupReturns({
        questId: 'add-auth',
        result: GetQuestResultStub({ quest: QuestStub(), flowSlice: FLOW_SLICE }),
      });

      const result = await GetQuestLayerResponder({
        args: { questId: 'add-auth', flowId: 'login-flow', packageName: 'web' },
      });

      expect(result).toStrictEqual({ content: [{ type: 'text', text: FLOW_SLICE }] });
    });
  });

  describe('the whole quest', () => {
    it('VALID: {questId, no format} => renders the whole quest as text', async () => {
      const proxy = GetQuestLayerResponderProxy();
      const quest = QuestStub();
      proxy.setupReturns({ questId: 'add-auth', result: GetQuestResultStub({ quest }) });

      const result = await GetQuestLayerResponder({ args: { questId: 'add-auth' } });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: questToTextDisplayTransformer({ quest }) }],
      });
    });

    it('VALID: {questId, format: json} => returns the quest payload with comments stripped', async () => {
      const proxy = GetQuestLayerResponderProxy();
      const quest = QuestStub();
      const questResult = GetQuestResultStub({ quest });
      // quest.comments defaults to [] via QuestStub — delete it AFTER building questResult, so the
      // deletion only shapes what we expect back, never what fed the mock.
      Reflect.deleteProperty(quest, 'comments');
      proxy.setupReturns({ questId: 'add-auth', result: questResult });

      const result = await GetQuestLayerResponder({
        args: { questId: 'add-auth', format: 'json' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ success: true, quest }, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });
  });

  describe('the orchestrator throws', () => {
    it('ERROR: {adapter rejects} => returns isError with the message', async () => {
      const proxy = GetQuestLayerResponderProxy();
      proxy.setupThrows({ questId: 'add-auth', error: new Error('Quest not found') });

      const result = await GetQuestLayerResponder({ args: { questId: 'add-auth' } });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'Quest not found' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });
});
