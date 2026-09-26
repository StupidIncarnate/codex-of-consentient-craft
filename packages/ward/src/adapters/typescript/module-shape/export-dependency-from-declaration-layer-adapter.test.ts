import * as ts from 'typescript';
import { exportDependencyFromDeclarationLayerAdapter } from './export-dependency-from-declaration-layer-adapter';
import { exportDependencyFromDeclarationLayerAdapterProxy } from './export-dependency-from-declaration-layer-adapter.proxy';

const firstExportDeclaration = ({ sourceText }: { sourceText: string }): ts.ExportDeclaration => {
  const sourceFile = ts.createSourceFile('a.ts', sourceText, ts.ScriptTarget.ES2022, true);
  const [statement] = sourceFile.statements;
  if (statement === undefined || !ts.isExportDeclaration(statement)) {
    throw new Error(`No export declaration parsed from: ${sourceText}`);
  }
  return statement;
};

describe('exportDependencyFromDeclarationLayerAdapter', () => {
  describe('valid inputs', () => {
    it('VALID: {export * from} => returns a star dependency', () => {
      exportDependencyFromDeclarationLayerAdapterProxy();
      const node = firstExportDeclaration({ sourceText: "export * from './x';" });

      const result = exportDependencyFromDeclarationLayerAdapter({ node });

      expect(result).toStrictEqual({ specifier: './x', kind: 'star', importedNames: [] });
    });

    it('VALID: {export {a} from} => returns a named dependency', () => {
      exportDependencyFromDeclarationLayerAdapterProxy();
      const node = firstExportDeclaration({ sourceText: "export { userFetchBroker } from './x';" });

      const result = exportDependencyFromDeclarationLayerAdapter({ node });

      expect(result).toStrictEqual({
        specifier: './x',
        kind: 'named',
        importedNames: ['userFetchBroker'],
      });
    });

    it('EDGE: {export * as ns from} => returns an opaque dependency', () => {
      exportDependencyFromDeclarationLayerAdapterProxy();
      const node = firstExportDeclaration({ sourceText: "export * as ns from './x';" });

      const result = exportDependencyFromDeclarationLayerAdapter({ node });

      expect(result).toStrictEqual({ specifier: './x', kind: 'opaque', importedNames: [] });
    });
  });
});
