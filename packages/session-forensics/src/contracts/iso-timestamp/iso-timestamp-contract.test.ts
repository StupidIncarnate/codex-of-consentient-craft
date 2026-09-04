import { isoTimestampContract } from './iso-timestamp-contract';
import { IsoTimestampStub } from './iso-timestamp.stub';

describe('isoTimestampContract', () => {
  describe('valid input', () => {
    it('VALID: {millisecond precision, Z zone} => returns the branded timestamp', () => {
      expect(isoTimestampContract.parse('2026-09-01T19:09:06.542Z')).toStrictEqual(
        IsoTimestampStub({ value: '2026-09-01T19:09:06.542Z' }),
      );
    });

    it('VALID: {second precision, Z zone} => returns the branded timestamp', () => {
      expect(isoTimestampContract.parse('2026-09-03T05:05:36Z')).toStrictEqual(
        IsoTimestampStub({ value: '2026-09-03T05:05:36Z' }),
      );
    });
  });

  describe('invalid input', () => {
    it('INVALID: {date only, no time} => throws', () => {
      expect(() => IsoTimestampStub({ value: '2026-09-01' })).toThrow(/datetime/u);
    });

    it('INVALID: {space instead of T} => throws', () => {
      expect(() => IsoTimestampStub({ value: '2026-09-01 19:09:06Z' })).toThrow(/datetime/u);
    });

    it('INVALID: {number} => throws', () => {
      expect(() => IsoTimestampStub({ value: 1_788_491_226 as never })).toThrow(/Expected string/u);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {empty string} => throws', () => {
      expect(() => IsoTimestampStub({ value: '' })).toThrow(/datetime/u);
    });
  });
});
