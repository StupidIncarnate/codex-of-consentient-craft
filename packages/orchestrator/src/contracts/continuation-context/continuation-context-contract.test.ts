import { continuationContextContract } from './continuation-context-contract';
import { ContinuationContextStub } from './continuation-context.stub';

describe('continuationContextContract', () => {
  describe('valid values', () => {
    it('VALID: {value: "Continue from step 2"} => parses successfully', () => {
      const result = ContinuationContextStub({ value: 'Continue from step 2' });

      expect(result).toBe('Continue from step 2');
    });

    it('VALID: {default stub} => parses with default value', () => {
      const result = ContinuationContextStub();

      expect(result).toBe('Continue from step 2');
    });

    it('VALID: {value: "Resume after file creation"} => parses different context', () => {
      const result = continuationContextContract.parse('Resume after file creation');

      expect(result).toBe('Resume after file creation');
    });
  });

  describe('invalid values', () => {
    it('INVALID_CONTINUATION_CONTEXT: {value: ""} => throws for empty string', () => {
      expect(() => continuationContextContract.parse('')).toThrow(/too_small/u);
    });

    it('INVALID_CONTINUATION_CONTEXT: {value: 123} => throws for non-string', () => {
      expect(() => continuationContextContract.parse(123 as never)).toThrow(/Expected string/u);
    });
  });
});
