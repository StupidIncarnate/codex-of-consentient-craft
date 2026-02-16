import { TruncatedStackStub } from './truncated-stack.stub';
import { truncatedStackContract } from './truncated-stack-contract';

describe('truncatedStackContract', () => {
  describe('valid input', () => {
    it('VALID: {value: stack string} => returns branded TruncatedStack', () => {
      const result = TruncatedStackStub({ value: 'at Object.<anonymous> (src/index.ts:10:5)' });

      expect(result).toBe('at Object.<anonymous> (src/index.ts:10:5)');
    });
  });

  describe('invalid input', () => {
    it('INVALID_VALUE: {value: number} => throws ZodError', () => {
      expect(() => truncatedStackContract.parse(123 as never)).toThrow(/Expected string/u);
    });
  });
});
