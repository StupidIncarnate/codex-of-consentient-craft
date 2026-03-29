import {
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
} from '../chat-entry/chat-entry.stub';
import { toolCallPairContract } from './tool-call-pair-contract';
import {
  ToolCallPairStub,
  ToolCallPairNoResultStub,
  OrphanToolResultStub,
} from './tool-call-pair.stub';

describe('toolCallPairContract', () => {
  describe('valid pairs', () => {
    it('VALID: {toolUse + toolResult} => parses paired entry', () => {
      const toolUse = AssistantToolUseChatEntryStub();
      const toolResult = AssistantToolResultChatEntryStub();
      const result = ToolCallPairStub();

      expect(result).toStrictEqual({ toolUse, toolResult });
    });

    it('VALID: {toolUse + null result} => parses pending pair', () => {
      const toolUse = AssistantToolUseChatEntryStub();
      const result = ToolCallPairNoResultStub();

      expect(result).toStrictEqual({ toolUse, toolResult: null });
    });

    it('VALID: {null toolUse + toolResult} => parses orphan result', () => {
      const toolResult = AssistantToolResultChatEntryStub();
      const result = OrphanToolResultStub();

      expect(result).toStrictEqual({ toolUse: null, toolResult });
    });

    it('VALID: {custom entries} => parses with overrides', () => {
      const toolUse = AssistantToolUseChatEntryStub({ toolName: 'Bash' });
      const toolResult = AssistantToolResultChatEntryStub({ content: 'output here' });

      const result = ToolCallPairStub({ toolUse, toolResult });

      expect(result).toStrictEqual({ toolUse, toolResult });
    });
  });

  describe('invalid pairs', () => {
    it('INVALID: {both null} => still parses (valid state)', () => {
      const result = toolCallPairContract.parse({ toolUse: null, toolResult: null });

      expect(result).toStrictEqual({ toolUse: null, toolResult: null });
    });
  });
});
