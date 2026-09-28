import * as ts from '#gateway/npm/typescript';
import { importDependencyFromDeclarationLayerTransformer } from './import-dependency-from-declaration-layer-transformer';

const firstImportDeclaration = ({ sourceText }: { sourceText: string }): ts.ImportDeclaration => {
  const sourceFile = ts.createSourceFile('a.ts', sourceText, ts.ScriptTarget.ES2022, true);
  const [statement] = sourceFile.statements;
  if (statement === undefined || !ts.isImportDeclaration(statement)) {
    throw new Error(`No import declaration parsed from: ${sourceText}`);
  }
  return statement;
};

describe('importDependencyFromDeclarationLayerTransformer', () => {
  describe('valid inputs', () => {
    it('VALID: {named import} => returns a named dependency', () => {
      const node = firstImportDeclaration({
        sourceText: "import { readFile } from '@dungeonmaster/node/fs';",
      });

      const result = importDependencyFromDeclarationLayerTransformer({ node });

      expect(result).toStrictEqual({
        specifier: '@dungeonmaster/node/fs',
        kind: 'named',
        importedNames: ['readFile'],
      });
    });

    it('VALID: {default import} => returns an opaque dependency', () => {
      const node = firstImportDeclaration({
        sourceText: "import ts from 'typescript';",
      });

      const result = importDependencyFromDeclarationLayerTransformer({ node });

      expect(result).toStrictEqual({ specifier: 'typescript', kind: 'opaque', importedNames: [] });
    });

    it('VALID: {side-effect import} => returns an opaque dependency', () => {
      const node = firstImportDeclaration({ sourceText: "import './side-effect';" });

      const result = importDependencyFromDeclarationLayerTransformer({ node });

      expect(result).toStrictEqual({
        specifier: './side-effect',
        kind: 'opaque',
        importedNames: [],
      });
    });
  });
});
