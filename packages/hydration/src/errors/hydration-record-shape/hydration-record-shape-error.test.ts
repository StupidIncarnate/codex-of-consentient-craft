import { HydrationRecordShapeError } from './hydration-record-shape-error';

describe('HydrationRecordShapeError', () => {
  describe('constructor()', () => {
    it('VALID: {fieldName: "urlSlug", validationMessage: "Required"} => names the ingredient, the field and the validation failure', () => {
      const error = new HydrationRecordShapeError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'guild',
        fieldName: 'urlSlug',
        validationMessage: 'Required',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationRecordShapeError',
        message:
          'recipe "guild-mid-execution": ingredient "guild"\'s route answered 2xx with a record that field "urlSlug" rejects: Required',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof HydrationRecordShapeError => returns true', () => {
      const error = new HydrationRecordShapeError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'guild',
        fieldName: 'urlSlug',
        validationMessage: 'Required',
      });

      expect(error instanceof HydrationRecordShapeError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new HydrationRecordShapeError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'guild',
        fieldName: 'urlSlug',
        validationMessage: 'Required',
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
