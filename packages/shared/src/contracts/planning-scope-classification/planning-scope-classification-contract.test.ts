import { planningScopeClassificationContract } from './planning-scope-classification-contract';
import { PlanningScopeClassificationStub } from './planning-scope-classification.stub';

describe('planningScopeClassificationContract', () => {
  describe('valid classifications', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const result = PlanningScopeClassificationStub();

      expect(result).toStrictEqual({
        size: 'medium',
        slicing: 'Slice A handles auth, Slice B handles session storage',
        slices: [],
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

    it('VALID: {populated slices} => parses successfully with formal slice registry', () => {
      const result = PlanningScopeClassificationStub({
        slices: [
          {
            name: 'backend',
            packages: ['@dungeonmaster/server'],
            flowIds: ['delete-quest'],
          },
          {
            name: 'frontend',
            packages: ['@dungeonmaster/web'],
            flowIds: ['delete-quest', 'session-list'],
          },
        ],
      });

      expect(result).toStrictEqual({
        size: 'medium',
        slicing: 'Slice A handles auth, Slice B handles session storage',
        slices: [
          {
            name: 'backend',
            packages: ['@dungeonmaster/server'],
            flowIds: ['delete-quest'],
          },
          {
            name: 'frontend',
            packages: ['@dungeonmaster/web'],
            flowIds: ['delete-quest', 'session-list'],
          },
        ],
        rationale: 'Two independent surfaces with a shared session contract',
        classifiedAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {slices field omitted} => defaults to empty array', () => {
      const result = planningScopeClassificationContract.parse({
        size: 'small',
        slicing: 'ok',
        rationale: 'ok',
        classifiedAt: '2024-01-15T10:00:00.000Z',
      });

      expect(result.slices).toStrictEqual([]);
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

    it('INVALID: {slice with non-kebab-case name} => throws validation error', () => {
      expect(() => {
        return planningScopeClassificationContract.parse({
          size: 'small',
          slicing: 'ok',
          slices: [
            {
              name: 'Bad-Name',
              packages: ['@dungeonmaster/server'],
              flowIds: ['delete-quest'],
            },
          ],
          rationale: 'ok',
          classifiedAt: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/invalid_string/u);
    });
  });
});
