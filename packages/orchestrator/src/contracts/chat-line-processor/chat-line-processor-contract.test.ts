import { chatLineProcessorContract } from './chat-line-processor-contract';
import { ChatLineProcessorStub } from './chat-line-processor.stub';

describe('chatLineProcessorContract', () => {
  describe('valid processor', () => {
    it('VALID: {processLine: function} => parses successfully', () => {
      const processor = ChatLineProcessorStub();

      const result = chatLineProcessorContract.parse(processor);

      expect(typeof result.processLine).toBe('function');
    });
  });

  describe('invalid processor', () => {
    it('INVALID_PROCESS_LINE: {processLine: "not a function"} => throws validation error', () => {
      expect(() => chatLineProcessorContract.parse({ processLine: 'not a function' })).toThrow(
        /Expected function/u,
      );
    });
  });
});
