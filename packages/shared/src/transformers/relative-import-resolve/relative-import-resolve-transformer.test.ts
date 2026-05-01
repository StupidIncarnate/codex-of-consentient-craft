import { relativeImportResolveTransformer } from './relative-import-resolve-transformer';
import { AbsoluteFilePathStub } from '../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('relativeImportResolveTransformer', () => {
  describe('relative imports', () => {
    it('VALID: {same-dir relative import} => returns resolved absolute path with .ts', () => {
      const sourceFile = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/startup/start-server.ts',
      });
      const importPath = ContentTextStub({ value: './server-flow' });
      const result = relativeImportResolveTransformer({ sourceFile, importPath });

      expect(result).toBe(
        AbsoluteFilePathStub({ value: '/repo/packages/server/src/startup/server-flow.ts' }),
      );
    });

    it('VALID: {parent-dir relative import} => resolves .. correctly', () => {
      const sourceFile = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/startup/start-server.ts',
      });
      const importPath = ContentTextStub({ value: '../flows/server/server-flow' });
      const result = relativeImportResolveTransformer({ sourceFile, importPath });

      expect(result).toBe(
        AbsoluteFilePathStub({ value: '/repo/packages/server/src/flows/server/server-flow.ts' }),
      );
    });

    it('VALID: {import already has .ts extension} => does not double-add .ts', () => {
      const sourceFile = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/startup/start-server.ts',
      });
      const importPath = ContentTextStub({ value: './server-flow.ts' });
      const result = relativeImportResolveTransformer({ sourceFile, importPath });

      expect(result).toBe(
        AbsoluteFilePathStub({ value: '/repo/packages/server/src/startup/server-flow.ts' }),
      );
    });
  });

  describe('non-relative imports', () => {
    it('VALID: {npm package import} => returns null', () => {
      const sourceFile = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/startup/start-server.ts',
      });
      const importPath = ContentTextStub({ value: 'express' });
      const result = relativeImportResolveTransformer({ sourceFile, importPath });

      expect(result).toBe(null);
    });

    it('VALID: {scoped package import} => returns null', () => {
      const sourceFile = AbsoluteFilePathStub({
        value: '/repo/packages/server/src/startup/start-server.ts',
      });
      const importPath = ContentTextStub({ value: '@dungeonmaster/shared/contracts' });
      const result = relativeImportResolveTransformer({ sourceFile, importPath });

      expect(result).toBe(null);
    });
  });
});
