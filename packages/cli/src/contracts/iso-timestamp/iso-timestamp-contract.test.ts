import { isoTimestampContract } from './iso-timestamp-contract';
import { IsoTimestampStub } from './iso-timestamp.stub';

describe('isoTimestampContract', () => {
  describe('valid inputs', () => {
    it('VALID: {ISO 8601 datetime with milliseconds} => parses successfully', () => {
      const result = isoTimestampContract.parse('2024-01-15T10:00:00.000Z');

      expect(result).toBe('2024-01-15T10:00:00.000Z');
    });

    it('VALID: {datetime without milliseconds} => parses successfully', () => {
      const result = isoTimestampContract.parse('2024-01-15T10:00:00Z');

      expect(result).toBe('2024-01-15T10:00:00Z');
    });

    it('VALID: {datetime at midnight} => parses successfully', () => {
      const result = isoTimestampContract.parse('2024-01-15T00:00:00.000Z');

      expect(result).toBe('2024-01-15T00:00:00.000Z');
    });

    it('VALID: {datetime at end of day} => parses successfully', () => {
      const result = isoTimestampContract.parse('2024-01-15T23:59:59.999Z');

      expect(result).toBe('2024-01-15T23:59:59.999Z');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_FORMAT: {timezone offset instead of Z} => throws error', () => {
      expect(() => isoTimestampContract.parse('2024-01-15T10:00:00+05:30')).toThrow(
        /Invalid datetime/u,
      );
    });

    it('INVALID_FORMAT: {not a datetime} => throws error', () => {
      expect(() => isoTimestampContract.parse('not-a-date')).toThrow(/Invalid datetime/u);
    });

    it('INVALID_FORMAT: {date only} => throws error', () => {
      expect(() => isoTimestampContract.parse('2024-01-15')).toThrow(/Invalid datetime/u);
    });

    it('INVALID_FORMAT: {empty string} => throws error', () => {
      expect(() => isoTimestampContract.parse('')).toThrow(/Invalid datetime/u);
    });

    it('INVALID_FORMAT: {time only} => throws error', () => {
      expect(() => isoTimestampContract.parse('10:00:00Z')).toThrow(/Invalid datetime/u);
    });

    it('INVALID_TYPE: {number} => throws error', () => {
      expect(() => isoTimestampContract.parse(1705312800000)).toThrow(/Expected string/u);
    });

    it('INVALID_TYPE: {null} => throws error', () => {
      expect(() => isoTimestampContract.parse(null)).toThrow(/Expected string/u);
    });

    it('INVALID_TYPE: {undefined} => throws error', () => {
      expect(() => isoTimestampContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid timestamp', () => {
      const result = IsoTimestampStub();

      expect(result).toBe('2024-01-15T10:00:00.000Z');
    });

    it('VALID: {custom value} => creates timestamp with custom value', () => {
      const result = IsoTimestampStub({ value: '2025-06-20T15:30:00.000Z' });

      expect(result).toBe('2025-06-20T15:30:00.000Z');
    });

    it('ERROR: {invalid custom value} => throws error', () => {
      expect(() => IsoTimestampStub({ value: 'invalid-timestamp' })).toThrow(/Invalid datetime/u);
    });
  });
});
