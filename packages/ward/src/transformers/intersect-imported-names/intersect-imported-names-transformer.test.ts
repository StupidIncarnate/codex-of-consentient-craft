import { intersectImportedNamesTransformer } from './intersect-imported-names-transformer';

describe('intersectImportedNamesTransformer', () => {
  describe('valid inputs', () => {
    it('VALID: {requestedNames: "all"} => returns every name unchanged', () => {
      const names = ['a', 'b'];

      const result = intersectImportedNamesTransformer({ names, requestedNames: 'all' });

      expect(result).toStrictEqual(['a', 'b']);
    });

    it('VALID: {requestedNames: specific list overlapping one name} => returns only the overlap', () => {
      const names = ['a', 'b'];

      const result = intersectImportedNamesTransformer({
        names,
        requestedNames: ['b'],
      });

      expect(result).toStrictEqual(['b']);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {requestedNames: specific list with no overlap} => returns an empty array', () => {
      const names = ['a'];

      const result = intersectImportedNamesTransformer({
        names,
        requestedNames: ['z'],
      });

      expect(result).toStrictEqual([]);
    });
  });
});
