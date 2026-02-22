import { sessionFilterContract } from './session-filter-contract';
import { SessionFilterStub } from './session-filter.stub';

describe('sessionFilterContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "all"} => parses all filter', () => {
      const result = sessionFilterContract.parse('all');

      expect(result).toBe('all');
    });

    it('VALID: {value: "quests-only"} => parses quests-only filter', () => {
      const result = sessionFilterContract.parse('quests-only');

      expect(result).toBe('quests-only');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: "sessions-only"} => throws for unknown filter', () => {
      expect(() => sessionFilterContract.parse('sessions-only')).toThrow(/Invalid enum value/u);
    });

    it('INVALID_VALUE: {value: ""} => throws for empty string', () => {
      expect(() => sessionFilterContract.parse('')).toThrow(/Invalid enum value/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => sessionFilterContract.parse(null)).toThrow(/received null/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => sessionFilterContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid session filter', () => {
      const result = SessionFilterStub();

      expect(result).toBe('all');
    });

    it('VALID: {value: "quests-only"} => creates filter with custom value', () => {
      const result = SessionFilterStub({ value: 'quests-only' });

      expect(result).toBe('quests-only');
    });
  });
});
