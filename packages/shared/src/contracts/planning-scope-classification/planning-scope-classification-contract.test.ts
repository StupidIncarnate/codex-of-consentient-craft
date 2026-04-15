import { planningScopeClassificationContract } from './planning-scope-classification-contract';
import { PlanningScopeClassificationStub } from './planning-scope-classification.stub';

describe('planningScopeClassificationContract', () => {
  describe('valid classifications', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const result = PlanningScopeClassificationStub();

      expect(result).toStrictEqual({
        size: 'medium',
        slicing: 'Slice A handles auth, Slice B handles session storage',
        rationale: 'Two independent surfaces with a shared session contract',
        classifiedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {size: "small"} => parses successfully', () => {
      const result = PlanningScopeClassificationStub({ size: 'small' });

      expect(result.size).toBe('small');
    });

    it('VALID: {size: "large"} => parses successfully', () => {
      const result = PlanningScopeClassificationStub({ size: 'large' });

      expect(result.size).toBe('large');
    });
  });

  describe('invalid classifications', () => {
    it('INVALID: {size: "huge"} => throws validation error', () => {
      expect(() => {
        return planningScopeClassificationContract.parse({
          size: 'huge',
          slicing: 'x',
          rationale: 'x',
          classifiedAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {slicing: ""} => throws validation error', () => {
      expect(() => {
        return planningScopeClassificationContract.parse({
          size: 'small',
          slicing: '',
          rationale: 'ok',
          classifiedAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {rationale: ""} => throws validation error', () => {
      expect(() => {
        return planningScopeClassificationContract.parse({
          size: 'small',
          slicing: 'ok',
          rationale: '',
          classifiedAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {classifiedAt: "not-a-date"} => throws validation error', () => {
      expect(() => {
        return planningScopeClassificationContract.parse({
          size: 'small',
          slicing: 'ok',
          rationale: 'ok',
          classifiedAt: 'not-a-date',
        });
      }).toThrow(/Invalid datetime/u);
    });
  });
});
