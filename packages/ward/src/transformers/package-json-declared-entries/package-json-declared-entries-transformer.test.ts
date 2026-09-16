import { PackageJsonRawStub } from '../../contracts/package-json-raw/package-json-raw.stub';

import { packageJsonDeclaredEntriesTransformer } from './package-json-declared-entries-transformer';

describe('packageJsonDeclaredEntriesTransformer', () => {
  describe('top-level main and types', () => {
    it('VALID: {main, types} => returns one declaration per field', () => {
      const manifest = PackageJsonRawStub({
        main: 'dist/index.js',
        types: 'dist/index.d.ts',
      });

      const result = packageJsonDeclaredEntriesTransformer({ manifest });

      expect(result).toStrictEqual([
        { field: 'main', declaredPath: 'dist/index.js' },
        { field: 'types', declaredPath: 'dist/index.d.ts' },
      ]);
    });
  });

  describe('exports conditions', () => {
    it('VALID: {exports["."] with import/require/types} => returns one declaration per condition', () => {
      const manifest = PackageJsonRawStub({
        exports: {
          '.': {
            import: './dist/index.js',
            require: './dist/index.js',
            types: './dist/index.d.ts',
          },
        },
      });

      const result = packageJsonDeclaredEntriesTransformer({ manifest });

      expect(result).toStrictEqual([
        { field: 'exports["."]["import"]', declaredPath: './dist/index.js' },
        { field: 'exports["."]["require"]', declaredPath: './dist/index.js' },
        { field: 'exports["."]["types"]', declaredPath: './dist/index.d.ts' },
      ]);
    });

    it('VALID: {exports["."] with a "source" condition} => skips "source", keeps the rest', () => {
      const manifest = PackageJsonRawStub({
        exports: {
          '.': {
            source: './src/index.ts',
            import: './dist/index.js',
          },
        },
      });

      const result = packageJsonDeclaredEntriesTransformer({ manifest });

      expect(result).toStrictEqual([
        { field: 'exports["."]["import"]', declaredPath: './dist/index.js' },
      ]);
    });

    it('VALID: {exports["."] as a bare string} => returns one declaration for the subpath', () => {
      const manifest = PackageJsonRawStub({
        exports: {
          '.': './dist/index.js',
        },
      });

      const result = packageJsonDeclaredEntriesTransformer({ manifest });

      expect(result).toStrictEqual([{ field: 'exports["."]', declaredPath: './dist/index.js' }]);
    });
  });

  describe('bin field', () => {
    it('VALID: {bin as a bare string} => returns one declaration for "bin"', () => {
      const manifest = PackageJsonRawStub({ bin: 'dist/bin/tool.js' });

      const result = packageJsonDeclaredEntriesTransformer({ manifest });

      expect(result).toStrictEqual([{ field: 'bin', declaredPath: 'dist/bin/tool.js' }]);
    });

    it('VALID: {bin as a name-to-path map} => returns one declaration per bin name', () => {
      const manifest = PackageJsonRawStub({
        bin: { dungeonmaster: './dist/bin/dungeonmaster.js' },
      });

      const result = packageJsonDeclaredEntriesTransformer({ manifest });

      expect(result).toStrictEqual([
        { field: 'bin["dungeonmaster"]', declaredPath: './dist/bin/dungeonmaster.js' },
      ]);
    });
  });

  describe('empty manifest', () => {
    it('EMPTY: {manifest with none of main/types/bin/exports} => returns an empty array', () => {
      const manifest = PackageJsonRawStub({ name: '@dungeonmaster/example' });

      const result = packageJsonDeclaredEntriesTransformer({ manifest });

      expect(result).toStrictEqual([]);
    });
  });
});
