import { relativeImportResolveTransformer } from './relative-import-resolve-transformer';

describe('relativeImportResolveTransformer', () => {
  describe('relative imports', () => {
    it('VALID: {same-dir relative import} => returns resolved absolute path with .ts', () => {
      const sourceFile = '/repo/packages/server/src/startup/start-server.ts';
      const importPath = './server-flow';
      const result = relativeImportResolveTransformer({ sourceFile, importPath });

      expect(result).toBe('/repo/packages/server/src/startup/server-flow.ts');
    });

    it('VALID: {parent-dir relative import} => resolves .. correctly', () => {
      const sourceFile = '/repo/packages/server/src/startup/start-server.ts';
      const importPath = '../flows/server/server-flow';
      const result = relativeImportResolveTransformer({ sourceFile, importPath });

      expect(result).toBe('/repo/packages/server/src/flows/server/server-flow.ts');
    });

    it('VALID: {import already has .ts extension} => does not double-add .ts', () => {
      const sourceFile = '/repo/packages/server/src/startup/start-server.ts';
      const importPath = './server-flow.ts';
      const result = relativeImportResolveTransformer({ sourceFile, importPath });

      expect(result).toBe('/repo/packages/server/src/startup/server-flow.ts');
    });
  });

  describe('non-relative imports', () => {
    it('VALID: {npm package import} => returns null', () => {
      const sourceFile = '/repo/packages/server/src/startup/start-server.ts';
      const importPath = 'express';
      const result = relativeImportResolveTransformer({ sourceFile, importPath });

      expect(result).toBe(null);
    });

    it('VALID: {scoped package import} => returns null', () => {
      const sourceFile = '/repo/packages/server/src/startup/start-server.ts';
      const importPath = '@dungeonmaster/shared/contracts';
      const result = relativeImportResolveTransformer({ sourceFile, importPath });

      expect(result).toBe(null);
    });
  });
});
