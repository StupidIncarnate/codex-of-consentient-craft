import { sectionLabelContract } from './section-label-contract';
import { SectionLabelStub } from './section-label.stub';

describe('sectionLabelContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "OBJECTIVES"} => parses section label', () => {
      const result = sectionLabelContract.parse('OBJECTIVES');

      expect(result).toBe('OBJECTIVES');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: ""} => throws for empty string', () => {
      expect(() => sectionLabelContract.parse('')).toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => sectionLabelContract.parse(null)).toThrow(/Expected string/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid section label', () => {
      const result = SectionLabelStub();

      expect(result).toBe('OBJECTIVES');
    });

    it('VALID: {value: "STEPS"} => creates label with custom value', () => {
      const result = SectionLabelStub({ value: 'STEPS' });

      expect(result).toBe('STEPS');
    });
  });
});
