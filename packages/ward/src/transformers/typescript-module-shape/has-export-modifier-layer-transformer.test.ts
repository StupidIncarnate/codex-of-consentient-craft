import * as ts from '#gateway/npm/typescript';
import { hasExportModifierLayerTransformer } from './has-export-modifier-layer-transformer';

const firstStatement = ({ sourceText }: { sourceText: string }): ts.Statement => {
  const sourceFile = ts.createSourceFile('a.ts', sourceText, ts.ScriptTarget.ES2022, true);
  const [statement] = sourceFile.statements;
  if (statement === undefined) {
    throw new Error(`No statement parsed from: ${sourceText}`);
  }
  return statement;
};

describe('hasExportModifierLayerTransformer', () => {
  describe('valid inputs', () => {
    it('VALID: {export const} => returns true', () => {
      const node = firstStatement({ sourceText: 'export const x = 1;' });

      const result = hasExportModifierLayerTransformer({ node });

      expect(result).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {const with no export modifier} => returns false', () => {
      const node = firstStatement({ sourceText: 'const x = 1;' });

      const result = hasExportModifierLayerTransformer({ node });

      expect(result).toBe(false);
    });
  });
});
