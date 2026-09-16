import { manifestEntryDeclarationContract } from './manifest-entry-declaration-contract';
import { ManifestEntryDeclarationStub } from './manifest-entry-declaration.stub';

describe('manifestEntryDeclarationContract', () => {
  describe('valid declarations', () => {
    it('VALID: {field: "main", declaredPath: "dist/index.js"} => parses successfully', () => {
      const declaration = ManifestEntryDeclarationStub({
        field: 'main',
        declaredPath: 'dist/index.js',
      });

      const result = manifestEntryDeclarationContract.parse(declaration);

      expect(result).toStrictEqual({ field: 'main', declaredPath: 'dist/index.js' });
    });

    it('VALID: {field: exports subpath condition} => parses successfully', () => {
      const declaration = ManifestEntryDeclarationStub({
        field: 'exports["."]["import"]',
        declaredPath: './dist/index.js',
      });

      const result = manifestEntryDeclarationContract.parse(declaration);

      expect(result).toStrictEqual({
        field: 'exports["."]["import"]',
        declaredPath: './dist/index.js',
      });
    });
  });

  describe('invalid declarations', () => {
    it('INVALID: {field: ""} => throws validation error', () => {
      expect(() => {
        return manifestEntryDeclarationContract.parse({ field: '', declaredPath: 'dist/index.js' });
      }).toThrow(/String must contain at least 1/u);
    });

    it('INVALID: {declaredPath: ""} => throws validation error', () => {
      expect(() => {
        return manifestEntryDeclarationContract.parse({ field: 'main', declaredPath: '' });
      }).toThrow(/String must contain at least 1/u);
    });

    it('INVALID: {missing declaredPath} => throws validation error', () => {
      expect(() => {
        return manifestEntryDeclarationContract.parse({ field: 'main' });
      }).toThrow(/Required/u);
    });
  });
});
