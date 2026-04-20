import { agentIdContract } from '../agent-id/agent-id-contract';
import { toolUseIdContract } from '../tool-use-id/tool-use-id-contract';
import { chatLineProcessorContract } from './chat-line-processor-contract';
import { ChatLineProcessorStub } from './chat-line-processor.stub';

describe('chatLineProcessorContract', () => {
  describe('valid processor', () => {
    it('VALID: {processLine: function} => parses successfully', () => {
      const processor = ChatLineProcessorStub();

      const result = chatLineProcessorContract.parse(processor);

      expect(result.processLine).toStrictEqual(expect.any(Function));
    });
  });

  describe('invalid processor', () => {
    it('INVALID: {processLine: "not a function"} => throws validation error', () => {
      expect(() => chatLineProcessorContract.parse({ processLine: 'not a function' })).toThrow(
        /Expected function/u,
      );
    });
  });

  describe('ChatLineProcessorStub defaults', () => {
    it('VALID: resolveToolUseIdForAgent({agentId}) => undefined (empty reverse map)', () => {
      const processor = ChatLineProcessorStub();

      const result = processor.resolveToolUseIdForAgent({
        agentId: agentIdContract.parse('agent-abc'),
      });

      expect(result).toBe(undefined);
    });

    it('VALID: registerAgentTranslation({agentId, toolUseId}) => noop, recorded on jest.fn', () => {
      const processor = ChatLineProcessorStub();
      const agentId = agentIdContract.parse('agent-abc');
      const toolUseId = toolUseIdContract.parse('toolu_01EaCJyt5y8gzMNyGYarwUDZ');

      processor.registerAgentTranslation({ agentId, toolUseId });

      expect(processor.registerAgentTranslation).toHaveBeenCalledWith({ agentId, toolUseId });
    });
  });
});
