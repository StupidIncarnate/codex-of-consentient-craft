import { blockingReasonContract } from './blocking-reason-contract';
import { BlockingReasonStub } from './blocking-reason.stub';

describe('blockingReasonContract', () => {
  describe('valid values', () => {
    it('VALID: {non-empty string} => parses successfully', () => {
      const result = blockingReasonContract.parse('User input needed');

      expect(result).toBe('User input needed');
    });

    it('VALID: {stub default} => creates blocking reason', () => {
      const result = BlockingReasonStub();

      expect(result).toBe('Step blocked pending user input');
    });

    it('VALID: {stub with custom value} => creates custom blocking reason', () => {
      const result = BlockingReasonStub({ value: 'Custom reason' });

      expect(result).toBe('Custom reason');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {empty string} => parses successfully', () => {
      const result = blockingReasonContract.parse('');

      expect(result).toBe('');
    });
  });

  describe('invalid values', () => {
    it('INVALID_TYPE: {number} => throws', () => {
      expect(() => blockingReasonContract.parse(123 as never)).toThrow(/Expected string/u);
    });

    it('INVALID_TYPE: {null} => throws', () => {
      expect(() => blockingReasonContract.parse(null as never)).toThrow(/Expected string/u);
    });

    it('INVALID_TYPE: {undefined} => throws', () => {
      expect(() => blockingReasonContract.parse(undefined as never)).toThrow(/Required/u);
    });

    it('INVALID_TYPE: {boolean} => throws', () => {
      expect(() => blockingReasonContract.parse(true as never)).toThrow(/Expected string/u);
    });

    it('INVALID_TYPE: {object} => throws', () => {
      expect(() => blockingReasonContract.parse({} as never)).toThrow(/Expected string/u);
    });

    it('INVALID_TYPE: {array} => throws', () => {
      expect(() => blockingReasonContract.parse([] as never)).toThrow(/Expected string/u);
    });
  });
});
