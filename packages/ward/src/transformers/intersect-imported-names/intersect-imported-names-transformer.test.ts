import { intersectImportedNamesTransformer } from './intersect-imported-names-transformer';
import { ImportedNameStub } from '../../contracts/imported-name/imported-name.stub';

describe('intersectImportedNamesTransformer', () => {
  describe('valid inputs', () => {
    it('VALID: {requestedNames: "all"} => returns every name unchanged', () => {
      const names = [ImportedNameStub({ value: 'a' }), ImportedNameStub({ value: 'b' })];

      const result = intersectImportedNamesTransformer({ names, requestedNames: 'all' });

      expect(result).toStrictEqual(['a', 'b']);
    });

    it('VALID: {requestedNames: specific list overlapping one name} => returns only the overlap', () => {
      const names = [ImportedNameStub({ value: 'a' }), ImportedNameStub({ value: 'b' })];

      const result = intersectImportedNamesTransformer({
        names,
        requestedNames: [ImportedNameStub({ value: 'b' })],
      });

      expect(result).toStrictEqual(['b']);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {requestedNames: specific list with no overlap} => returns an empty array', () => {
      const names = [ImportedNameStub({ value: 'a' })];

      const result = intersectImportedNamesTransformer({
        names,
        requestedNames: [ImportedNameStub({ value: 'z' })],
      });

      expect(result).toStrictEqual([]);
    });
  });
});
