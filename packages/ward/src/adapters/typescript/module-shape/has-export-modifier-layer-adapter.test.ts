import * as ts from 'typescript';
import { hasExportModifierLayerAdapter } from './has-export-modifier-layer-adapter';
import { hasExportModifierLayerAdapterProxy } from './has-export-modifier-layer-adapter.proxy';

const firstStatement = ({ sourceText }: { sourceText: string }): ts.Statement => {
  const sourceFile = ts.createSourceFile('a.ts', sourceText, ts.ScriptTarget.ES2022, true);
  const [statement] = sourceFile.statements;
  if (statement === undefined) {
    throw new Error(`No statement parsed from: ${sourceText}`);
  }
  return statement;
};

describe('hasExportModifierLayerAdapter', () => {
  describe('valid inputs', () => {
    it('VALID: {export const} => returns true', () => {
      hasExportModifierLayerAdapterProxy();
      const node = firstStatement({ sourceText: 'export const x = 1;' });

      const result = hasExportModifierLayerAdapter({ node });

      expect(result).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {const with no export modifier} => returns false', () => {
      hasExportModifierLayerAdapterProxy();
      const node = firstStatement({ sourceText: 'const x = 1;' });

      const result = hasExportModifierLayerAdapter({ node });

      expect(result).toBe(false);
    });
  });
});
