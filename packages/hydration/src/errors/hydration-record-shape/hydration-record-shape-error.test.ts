import { HydrationRecordShapeError } from './hydration-record-shape-error';

describe('HydrationRecordShapeError', () => {
  describe('constructor()', () => {
    it('VALID: {route: "api", fieldName: "urlSlug", validationMessage: "received undefined"} => names the route and says it answered 2xx', () => {
      const error = new HydrationRecordShapeError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'guild',
        route: 'api',
        fieldName: 'urlSlug',
        validationMessage: 'received undefined',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationRecordShapeError',
        message:
          'recipe "guild-mid-execution": ingredient "guild"\'s "api" route answered 2xx with a record that field "urlSlug" rejects: received undefined',
      });
    });

    it('VALID: {route: "write", fieldName: "urlSlug", validationMessage: "received undefined"} => names the write route with no status claimed', () => {
      const error = new HydrationRecordShapeError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'guild',
        route: 'write',
        fieldName: 'urlSlug',
        validationMessage: 'received undefined',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationRecordShapeError',
        message:
          'recipe "guild-mid-execution": ingredient "guild"\'s write route returned a record that field "urlSlug" rejects: received undefined',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof HydrationRecordShapeError => returns true', () => {
      const error = new HydrationRecordShapeError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'guild',
        route: 'api',
        fieldName: 'urlSlug',
        validationMessage: 'received undefined',
      });

      expect(error instanceof HydrationRecordShapeError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new HydrationRecordShapeError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'guild',
        route: 'api',
        fieldName: 'urlSlug',
        validationMessage: 'received undefined',
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
