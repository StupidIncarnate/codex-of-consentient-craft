import * as ts from 'typescript';
import { localExportNamesFromStatementLayerAdapter } from './local-export-names-from-statement-layer-adapter';
import { localExportNamesFromStatementLayerAdapterProxy } from './local-export-names-from-statement-layer-adapter.proxy';

const firstStatement = ({ sourceText }: { sourceText: string }): ts.Statement => {
  const sourceFile = ts.createSourceFile('a.ts', sourceText, ts.ScriptTarget.ES2022, true);
  const [statement] = sourceFile.statements;
  if (statement === undefined) {
    throw new Error(`No statement parsed from: ${sourceText}`);
  }
  return statement;
};

describe('localExportNamesFromStatementLayerAdapter', () => {
  describe('valid inputs', () => {
    it('VALID: {export const} => returns the declared name', () => {
      localExportNamesFromStatementLayerAdapterProxy();
      const node = firstStatement({ sourceText: 'export const userFetchBroker = () => {};' });

      const result = localExportNamesFromStatementLayerAdapter({ node });

      expect(result).toStrictEqual(['userFetchBroker']);
    });

    it('VALID: {local export list} => returns each named local re-export', () => {
      localExportNamesFromStatementLayerAdapterProxy();
      const node = firstStatement({ sourceText: 'export { userFetchBroker };' });

      const result = localExportNamesFromStatementLayerAdapter({ node });

      expect(result).toStrictEqual(['userFetchBroker']);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {const with no export modifier} => returns an empty array', () => {
      localExportNamesFromStatementLayerAdapterProxy();
      const node = firstStatement({ sourceText: 'const userFetchBroker = () => {};' });

      const result = localExportNamesFromStatementLayerAdapter({ node });

      expect(result).toStrictEqual([]);
    });
  });
});
