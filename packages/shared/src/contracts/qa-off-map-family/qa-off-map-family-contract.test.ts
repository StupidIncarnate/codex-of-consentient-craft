import { qaOffMapFamilyContract } from './qa-off-map-family-contract';
import { QaOffMapFamilyStub } from './qa-off-map-family.stub';

describe('qaOffMapFamilyContract', () => {
  describe('enum membership', () => {
    it('VALID: {options} => exposes exactly the seven off-map probe families', () => {
      expect(qaOffMapFamilyContract.options).toStrictEqual([
        're-entry',
        'concurrency',
        'interruption',
        'staleness',
        'configuration',
        'hostile-input',
        'perf',
      ]);
    });

    it.each(qaOffMapFamilyContract.options)('VALID: {family: %s} => parses to itself', (family) => {
      expect(QaOffMapFamilyStub({ value: family })).toBe(family);
    });
  });

  describe('default stub', () => {
    it('VALID: {no args} => defaults to concurrency', () => {
      expect(QaOffMapFamilyStub()).toBe('concurrency');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {family: "performance"} => throws', () => {
      expect(() => QaOffMapFamilyStub({ value: 'performance' })).toThrow(/Invalid enum value/u);
    });

    it('EMPTY: {family: ""} => throws', () => {
      expect(() => QaOffMapFamilyStub({ value: '' })).toThrow(/Invalid enum value/u);
    });
  });
});
