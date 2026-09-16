import { HydrationSavedFieldMissingError } from './hydration-saved-field-missing-error';

describe('HydrationSavedFieldMissingError', () => {
  describe('constructor()', () => {
    it('VALID: {savedRecordName: "guild", fieldName: "urlSlug", declaredFieldNames: [id, name]} => names the record, the missing field, and the ones it declares', () => {
      const error = new HydrationSavedFieldMissingError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'quest',
        savedRecordName: 'guild',
        fieldName: 'urlSlug',
        declaredFieldNames: ['id', 'name'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationSavedFieldMissingError',
        message:
          'recipe "guild-mid-execution": ingredient "quest" calls fromSaved("guild", "urlSlug"), but the record saved as "guild" never declares that field. Fields it declares: id, name',
      });
    });

    it('EMPTY: {declaredFieldNames: []} => names the record as declaring no fields at all', () => {
      const error = new HydrationSavedFieldMissingError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'quest',
        savedRecordName: 'guild',
        fieldName: 'urlSlug',
        declaredFieldNames: [],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationSavedFieldMissingError',
        message:
          'recipe "guild-mid-execution": ingredient "quest" calls fromSaved("guild", "urlSlug"), but the record saved as "guild" never declares that field. Fields it declares: (none)',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof HydrationSavedFieldMissingError => returns true', () => {
      const error = new HydrationSavedFieldMissingError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'quest',
        savedRecordName: 'guild',
        fieldName: 'urlSlug',
        declaredFieldNames: [],
      });

      expect(error instanceof HydrationSavedFieldMissingError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new HydrationSavedFieldMissingError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'quest',
        savedRecordName: 'guild',
        fieldName: 'urlSlug',
        declaredFieldNames: [],
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
