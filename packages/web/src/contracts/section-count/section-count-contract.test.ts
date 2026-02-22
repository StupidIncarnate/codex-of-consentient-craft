import { sectionCountContract } from './section-count-contract';
import { SectionCountStub } from './section-count.stub';

describe('sectionCountContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 5} => parses section count', () => {
      const result = sectionCountContract.parse(5);

      expect(result).toBe(5);
    });

    it('VALID: {value: 0} => parses zero count', () => {
      const result = sectionCountContract.parse(0);

      expect(result).toBe(0);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: -1} => throws for negative number', () => {
      expect(() => sectionCountContract.parse(-1)).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('INVALID_VALUE: {value: 1.5} => throws for non-integer', () => {
      expect(() => sectionCountContract.parse(1.5)).toThrow(/Expected integer/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => sectionCountContract.parse(null)).toThrow(/Expected number/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid section count', () => {
      const result = SectionCountStub();

      expect(result).toBe(3);
    });

    it('VALID: {value: 10} => creates count with custom value', () => {
      const result = SectionCountStub({ value: 10 });

      expect(result).toBe(10);
    });
  });
});
