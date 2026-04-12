import { ToolNameStub } from '../../../contracts/tool-name/tool-name.stub';
import { GetQuestResultStub } from '../../../contracts/get-quest-result/get-quest-result.stub';
import { ModifyQuestResultStub } from '../../../contracts/modify-quest-result/modify-quest-result.stub';
import { VerifyQuestResultStub } from '../../../contracts/verify-quest-result/verify-quest-result.stub';
import { QuestHandleResponderProxy } from './quest-handle-responder.proxy';

const JSON_INDENT_SPACES = 2;

describe('QuestHandleResponder', () => {
  describe('get-quest', () => {
    it('VALID: {questId} => returns quest data', async () => {
      const proxy = QuestHandleResponderProxy();
      const questResult = GetQuestResultStub();
      proxy.setupGetQuestReturns({ result: questResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest' }),
        args: { questId: 'test-quest-id', format: 'json' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(questResult, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it('VALID: {questId, stage} => returns filtered quest data', async () => {
      const proxy = QuestHandleResponderProxy();
      const questResult = GetQuestResultStub();
      proxy.setupGetQuestReturns({ result: questResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest' }),
        args: { questId: 'test-quest-id', stage: 'spec', format: 'json' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(questResult, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it('VALID: {unsuccessful result} => returns isError true', async () => {
      const proxy = QuestHandleResponderProxy();
      const questResult = GetQuestResultStub({ success: false });
      proxy.setupGetQuestReturns({ result: questResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest' }),
        args: { questId: 'test-quest-id' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(questResult, null, JSON_INDENT_SPACES),
          },
        ],
        isError: true,
      });
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupGetQuestThrows({ error: new Error('Quest not found') });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest' }),
        args: { questId: 'test-quest-id' },
      });

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

  describe('modify-quest', () => {
    it('VALID: {questId, input} => returns modify result', async () => {
      const proxy = QuestHandleResponderProxy();
      const modifyResult = ModifyQuestResultStub();
      proxy.setupModifyQuestReturns({ result: modifyResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'modify-quest' }),
        args: { questId: 'test-quest-id', status: 'approved' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(modifyResult, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it('VALID: {unsuccessful result} => returns isError true', async () => {
      const proxy = QuestHandleResponderProxy();
      const modifyResult = ModifyQuestResultStub({ success: false });
      proxy.setupModifyQuestReturns({ result: modifyResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'modify-quest' }),
        args: { questId: 'test-quest-id' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(modifyResult, null, JSON_INDENT_SPACES),
          },
        ],
        isError: true,
      });
    });

    it('EDGE: {workItems in args} => strips workItems before passing to adapter', async () => {
      const proxy = QuestHandleResponderProxy();
      const modifyResult = ModifyQuestResultStub();
      proxy.setupModifyQuestReturns({ result: modifyResult });

      await proxy.callResponder({
        tool: ToolNameStub({ value: 'modify-quest' }),
        args: {
          questId: 'test-quest-id',
          title: 'Keep This',
          workItems: [{ id: 'sneaky-item', status: 'complete' }],
        },
      });

      const passedInput = proxy.getLastModifyInput();

      expect(passedInput).toStrictEqual({
        questId: 'test-quest-id',
        title: 'Keep This',
      });
    });

    it('EDGE: {wardResults in args} => strips wardResults before passing to adapter', async () => {
      const proxy = QuestHandleResponderProxy();
      const modifyResult = ModifyQuestResultStub();
      proxy.setupModifyQuestReturns({ result: modifyResult });

      await proxy.callResponder({
        tool: ToolNameStub({ value: 'modify-quest' }),
        args: {
          questId: 'test-quest-id',
          wardResults: [{ id: 'sneaky-result' }],
        },
      });

      const passedInput = proxy.getLastModifyInput();

      expect(passedInput).toStrictEqual({
        questId: 'test-quest-id',
      });
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupModifyQuestThrows({ error: new Error('Modify failed') });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'modify-quest' }),
        args: { questId: 'test-quest-id' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'Modify failed' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('start-quest', () => {
    it('VALID: {questId} => returns processId', async () => {
      const proxy = QuestHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'start-quest' }),
        args: { questId: 'add-auth' },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: result.content[0]!.text }],
      });
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupStartQuestThrows({ error: new Error('Start failed') });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'start-quest' }),
        args: { questId: 'add-auth' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'Start failed' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('get-quest-status', () => {
    it('VALID: {processId} => returns status', async () => {
      const proxy = QuestHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest-status' }),
        args: { processId: 'proc-12345' },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: result.content[0]!.text }],
      });
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupGetQuestStatusThrows({ error: new Error('Status failed') });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'get-quest-status' }),
        args: { processId: 'proc-12345' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'Status failed' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('verify-quest', () => {
    it('VALID: {questId} => returns verification result', async () => {
      const proxy = QuestHandleResponderProxy();
      const verifyResult = VerifyQuestResultStub();
      proxy.setupVerifyQuestReturns({ result: verifyResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'verify-quest' }),
        args: { questId: 'test-quest-id' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(verifyResult, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it('VALID: {unsuccessful result} => returns isError true', async () => {
      const proxy = QuestHandleResponderProxy();
      const verifyResult = VerifyQuestResultStub({ success: false });
      proxy.setupVerifyQuestReturns({ result: verifyResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'verify-quest' }),
        args: { questId: 'test-quest-id' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(verifyResult, null, JSON_INDENT_SPACES),
          },
        ],
        isError: true,
      });
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupVerifyQuestThrows({ error: new Error('Verify failed') });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'verify-quest' }),
        args: { questId: 'test-quest-id' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'Verify failed' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('list-quests', () => {
    it('VALID: {guildId} => returns quests list', async () => {
      const proxy = QuestHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'list-quests' }),
        args: { guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: result.content[0]!.text }],
      });
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupListQuestsThrows({ error: new Error('List failed') });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'list-quests' }),
        args: { guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'List failed' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('validate-spec', () => {
    it('VALID: {validate-spec returns success result} => responder returns content JSON', async () => {
      const proxy = QuestHandleResponderProxy();
      const validateResult = VerifyQuestResultStub();
      proxy.setupValidateSpecReturns({ result: validateResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'validate-spec' }),
        args: { questId: 'test-quest-id' },
      });

      const parsed: unknown = JSON.parse(String(result.content[0]!.text));

      expect(parsed).toStrictEqual(JSON.parse(JSON.stringify(validateResult)));
      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(validateResult, null, JSON_INDENT_SPACES),
          },
        ],
      });
    });

    it('INVALID: {validate-spec returns success false} => responder sets isError true', async () => {
      const proxy = QuestHandleResponderProxy();
      const validateResult = VerifyQuestResultStub({
        success: false,
        error: 'Spec has issues' as never,
      });
      proxy.setupValidateSpecReturns({ result: validateResult });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'validate-spec' }),
        args: { questId: 'test-quest-id' },
      });

      const parsed: unknown = JSON.parse(String(result.content[0]!.text));

      expect(parsed).toStrictEqual(JSON.parse(JSON.stringify(validateResult)));
      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(validateResult, null, JSON_INDENT_SPACES),
          },
        ],
        isError: true,
      });
    });

    it('ERROR: {validate-spec adapter throws} => responder catches and returns error content with isError true', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupValidateSpecThrows({ error: new Error('Validate failed') });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'validate-spec' }),
        args: { questId: 'test-quest-id' },
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'Validate failed' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('list-guilds', () => {
    it('VALID: {} => returns guilds list', async () => {
      const proxy = QuestHandleResponderProxy();

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'list-guilds' }),
        args: {},
      });

      expect(result).toStrictEqual({
        content: [{ type: 'text', text: result.content[0]!.text }],
      });
    });

    it('ERROR: {adapter throws} => returns error response', async () => {
      const proxy = QuestHandleResponderProxy();
      proxy.setupListGuildsThrows({ error: new Error('Guilds failed') });

      const result = await proxy.callResponder({
        tool: ToolNameStub({ value: 'list-guilds' }),
        args: {},
      });

      expect(result).toStrictEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { success: false, error: 'Guilds failed' },
              null,
              JSON_INDENT_SPACES,
            ),
          },
        ],
        isError: true,
      });
    });
  });

  describe('unknown tool', () => {
    it('ERROR: {tool: unknown-tool} => throws unknown tool error', async () => {
      const proxy = QuestHandleResponderProxy();

      await expect(
        proxy.callResponder({
          tool: ToolNameStub({ value: 'unknown-tool' }),
          args: {},
        }),
      ).rejects.toThrow(/Unknown quest tool/u);
    });
  });
});
