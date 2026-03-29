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
});
