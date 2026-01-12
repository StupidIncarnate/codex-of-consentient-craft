import { filepathResolveRelativeImportTransformer } from './filepath-resolve-relative-import-transformer';

describe('filepathResolveRelativeImportTransformer', () => {
  describe('single-level relative imports', () => {
    it("VALID: {currentFilePath: '/src/foo/bar.ts', importPath: '../baz'} => returns '/src/baz.ts'", () => {
      const result = filepathResolveRelativeImportTransformer({
        currentFilePath: '/src/foo/bar.ts',
        importPath: '../baz',
      });

      expect(result).toBe('/src/baz.ts');
    });

    it("VALID: {currentFilePath: '/project/src/user/user-broker.ts', importPath: '../adapter/http-adapter'} => returns '/project/src/adapter/http-adapter.ts'", () => {
      const result = filepathResolveRelativeImportTransformer({
        currentFilePath: '/project/src/user/user-broker.ts',
        importPath: '../adapter/http-adapter',
      });

      expect(result).toBe('/project/src/adapter/http-adapter.ts');
    });

    it("VALID: {currentFilePath: '/app/components/button.ts', importPath: './icon'} => returns '/app/components/icon.ts'", () => {
      const result = filepathResolveRelativeImportTransformer({
        currentFilePath: '/app/components/button.ts',
        importPath: './icon',
      });

      expect(result).toBe('/app/components/icon.ts');
    });
  });

  describe('multi-level relative imports', () => {
    it("VALID: {currentFilePath: '/src/foo/bar.ts', importPath: '../../baz'} => returns '/baz.ts'", () => {
      const result = filepathResolveRelativeImportTransformer({
        currentFilePath: '/src/foo/bar.ts',
        importPath: '../../baz',
      });

      expect(result).toBe('/baz.ts');
    });

    it("VALID: {currentFilePath: '/project/src/user/profile/avatar.ts', importPath: '../../../adapters/http/http-adapter'} => returns '/project/adapters/http/http-adapter.ts'", () => {
      const result = filepathResolveRelativeImportTransformer({
        currentFilePath: '/project/src/user/profile/avatar.ts',
        importPath: '../../../adapters/http/http-adapter',
      });

      expect(result).toBe('/project/adapters/http/http-adapter.ts');
    });

    it("VALID: {currentFilePath: '/a/b/c/d/e.ts', importPath: '../../../../x/y/z'} => returns '/x/y/z.ts'", () => {
      const result = filepathResolveRelativeImportTransformer({
        currentFilePath: '/a/b/c/d/e.ts',
        importPath: '../../../../x/y/z',
      });

      expect(result).toBe('/x/y/z.ts');
    });
  });

  describe('imports with file extensions', () => {
    it("VALID: {currentFilePath: '/src/foo/bar.ts', importPath: '../baz.ts'} => returns '/src/baz.ts'", () => {
      const result = filepathResolveRelativeImportTransformer({
        currentFilePath: '/src/foo/bar.ts',
        importPath: '../baz.ts',
      });

      expect(result).toBe('/src/baz.ts');
    });

    it("VALID: {currentFilePath: '/src/foo/bar.ts', importPath: '../baz.tsx'} => returns '/src/baz.tsx'", () => {
      const result = filepathResolveRelativeImportTransformer({
        currentFilePath: '/src/foo/bar.ts',
        importPath: '../baz.tsx',
      });

      expect(result).toBe('/src/baz.tsx');
    });

    it("VALID: {currentFilePath: '/src/foo/bar.ts', importPath: '../baz.js'} => returns '/src/baz.js'", () => {
      const result = filepathResolveRelativeImportTransformer({
        currentFilePath: '/src/foo/bar.ts',
        importPath: '../baz.js',
      });

      expect(result).toBe('/src/baz.js');
    });

    it("VALID: {currentFilePath: '/src/foo/bar.ts', importPath: '../baz.jsx'} => returns '/src/baz.jsx'", () => {
      const result = filepathResolveRelativeImportTransformer({
        currentFilePath: '/src/foo/bar.ts',
        importPath: '../baz.jsx',
      });

      expect(result).toBe('/src/baz.jsx');
    });
  });

  describe('same-directory imports', () => {
    it("VALID: {currentFilePath: '/src/foo/bar.ts', importPath: './baz'} => returns '/src/foo/baz.ts'", () => {
      const result = filepathResolveRelativeImportTransformer({
        currentFilePath: '/src/foo/bar.ts',
        importPath: './baz',
      });

      expect(result).toBe('/src/foo/baz.ts');
    });

    it("VALID: {currentFilePath: '/src/foo/bar.ts', importPath: './nested/file'} => returns '/src/foo/nested/file.ts'", () => {
      const result = filepathResolveRelativeImportTransformer({
        currentFilePath: '/src/foo/bar.ts',
        importPath: './nested/file',
      });

      expect(result).toBe('/src/foo/nested/file.ts');
    });
  });

  describe('edge cases', () => {
    it("EDGE: {currentFilePath: '/file.ts', importPath: './other'} => returns '/other.ts'", () => {
      const result = filepathResolveRelativeImportTransformer({
        currentFilePath: '/file.ts',
        importPath: './other',
      });

      expect(result).toBe('/other.ts');
    });

    it("EDGE: {currentFilePath: '/a/b.ts', importPath: './../c'} => returns '/c.ts'", () => {
      const result = filepathResolveRelativeImportTransformer({
        currentFilePath: '/a/b.ts',
        importPath: './../c',
      });

      expect(result).toBe('/c.ts');
    });

    it("EDGE: {currentFilePath: '/src/foo/bar.ts', importPath: './././baz'} => returns '/src/foo/baz.ts'", () => {
      const result = filepathResolveRelativeImportTransformer({
        currentFilePath: '/src/foo/bar.ts',
        importPath: './././baz',
      });

      expect(result).toBe('/src/foo/baz.ts');
    });

    it("EDGE: {currentFilePath: '/src/foo/bar.ts', importPath: '../.'} => returns '/src.ts'", () => {
      const result = filepathResolveRelativeImportTransformer({
        currentFilePath: '/src/foo/bar.ts',
        importPath: '../.',
      });

      expect(result).toBe('/src.ts');
    });

    it("EDGE: {currentFilePath: '/src/foo/bar.ts', importPath: 'baz'} => returns '/src/foo/baz.ts'", () => {
      const result = filepathResolveRelativeImportTransformer({
        currentFilePath: '/src/foo/bar.ts',
        importPath: 'baz',
      });

      expect(result).toBe('/src/foo/baz.ts');
    });
  });

  describe('complex paths', () => {
    it("VALID: {currentFilePath: '/project/src/brokers/user/user-broker.ts', importPath: '../../adapters/http/http-adapter'} => returns '/project/src/adapters/http/http-adapter.ts'", () => {
      const result = filepathResolveRelativeImportTransformer({
        currentFilePath: '/project/src/brokers/user/user-broker.ts',
        importPath: '../../adapters/http/http-adapter',
      });

      expect(result).toBe('/project/src/adapters/http/http-adapter.ts');
    });

    it("VALID: {currentFilePath: '/home/user/projects/app/src/components/button/button.tsx', importPath: '../../../utils/helpers'} => returns '/home/user/projects/app/utils/helpers.ts'", () => {
      const result = filepathResolveRelativeImportTransformer({
        currentFilePath: '/home/user/projects/app/src/components/button/button.tsx',
        importPath: '../../../utils/helpers',
      });

      expect(result).toBe('/home/user/projects/app/utils/helpers.ts');
    });
  });

  describe('paths with empty segments', () => {
    it("EDGE: {currentFilePath: '/src/foo/bar.ts', importPath: './/baz'} => returns '/src/foo/baz.ts'", () => {
      const result = filepathResolveRelativeImportTransformer({
        currentFilePath: '/src/foo/bar.ts',
        importPath: './/baz',
      });

      expect(result).toBe('/src/foo/baz.ts');
    });

    it("EDGE: {currentFilePath: '/src/foo/bar.ts', importPath: '..//baz'} => returns '/src/baz.ts'", () => {
      const result = filepathResolveRelativeImportTransformer({
        currentFilePath: '/src/foo/bar.ts',
        importPath: '..//baz',
      });

      expect(result).toBe('/src/baz.ts');
    });
  });

  describe('mixed navigation', () => {
    it("VALID: {currentFilePath: '/src/a/b/c.ts', importPath: '../../x/../y/z'} => returns '/src/y/z.ts'", () => {
      const result = filepathResolveRelativeImportTransformer({
        currentFilePath: '/src/a/b/c.ts',
        importPath: '../../x/../y/z',
      });

      expect(result).toBe('/src/y/z.ts');
    });

    it("VALID: {currentFilePath: '/src/a/b/c.ts', importPath: '.././../x/./y'} => returns '/src/x/y.ts'", () => {
      const result = filepathResolveRelativeImportTransformer({
        currentFilePath: '/src/a/b/c.ts',
        importPath: '.././../x/./y',
      });

      expect(result).toBe('/src/x/y.ts');
    });
  });
});
