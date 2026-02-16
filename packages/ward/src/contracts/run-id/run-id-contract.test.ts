import { runIdContract } from './run-id-contract';
import { RunIdStub } from './run-id.stub';

describe('runIdContract', () => {
  describe('valid inputs', () => {
    it('VALID: {standard run ID} => parses successfully', () => {
      const result = runIdContract.parse('1739625600000-a3f1');

      expect(result).toBe('1739625600000-a3f1');
    });

    it('VALID: {different timestamp and hex} => parses successfully', () => {
      const result = runIdContract.parse('1700000000000-beef');

      expect(result).toBe('1700000000000-beef');
    });

    it('VALID: {short hex} => parses successfully', () => {
      const result = runIdContract.parse('0-0');

      expect(result).toBe('0-0');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {empty string} => throws validation error', () => {
      expect(() => runIdContract.parse('')).toThrow(/Invalid RunId format/u);
    });

    it('INVALID_VALUE: {no hyphen} => throws validation error', () => {
      expect(() => runIdContract.parse('1739625600000a3f1')).toThrow(/Invalid RunId format/u);
    });

    it('INVALID_VALUE: {non-hex after hyphen} => throws validation error', () => {
      expect(() => runIdContract.parse('1739625600000-ZZZZ')).toThrow(/Invalid RunId format/u);
    });

    it('INVALID_VALUE: {letters in timestamp} => throws validation error', () => {
      expect(() => runIdContract.parse('abc-a3f1')).toThrow(/Invalid RunId format/u);
    });

    it('EMPTY: {null} => throws validation error', () => {
      expect(() => runIdContract.parse(null)).toThrow(/received null/u);
    });

    it('EMPTY: {undefined} => throws validation error', () => {
      expect(() => runIdContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => returns valid run ID', () => {
      const result = RunIdStub();

      expect(result).toBe('1739625600000-a3f1');
    });

    it('VALID: {custom value} => returns custom run ID', () => {
      const result = RunIdStub({ value: '1700000000000-beef' });

      expect(result).toBe('1700000000000-beef');
    });
  });
});
