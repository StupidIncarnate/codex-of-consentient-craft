import * as ts from '#gateway/npm/typescript';
import { sourceFilePrependStatementsTransformer } from './source-file-prepend-statements-transformer';
import { TypescriptSourceFileStub } from '../../contracts/typescript-source-file/typescript-source-file.stub';
import { TypescriptNodeFactoryStub } from '../../contracts/typescript-node-factory/typescript-node-factory.stub';
import { TypescriptStatementStub } from '../../contracts/typescript-statement/typescript-statement.stub';

describe('sourceFilePrependStatementsTransformer', () => {
  describe('valid statement prepending', () => {
    it('VALID: {sourceFile, statements} => returns source file with prepended statements', () => {
      const code = `describe('test', () => {});`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const nodeFactory = TypescriptNodeFactoryStub({ value: ts.factory });
      const mockStatement = TypescriptStatementStub({
        value: ts.factory.createExpressionStatement(
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier('jest'),
              ts.factory.createIdentifier('mock'),
            ),
            undefined,
            [ts.factory.createStringLiteral('fs')],
          ),
        ),
      });

      const result = sourceFilePrependStatementsTransformer({
        sourceFile,
        statements: [mockStatement],
        nodeFactory,
      });

      const printer = ts.createPrinter();
      const output = printer.printFile(result as unknown as ts.SourceFile);

      expect(output).toBe('jest.mock("fs");\ndescribe(\'test\', () => { });\n');
    });

    it('VALID: {multiple statements} => prepends all in order', () => {
      const code = `const x = 1;`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const nodeFactory = TypescriptNodeFactoryStub({ value: ts.factory });
      const statement1 = TypescriptStatementStub({
        value: ts.factory.createExpressionStatement(
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier('jest'),
              ts.factory.createIdentifier('mock'),
            ),
            undefined,
            [ts.factory.createStringLiteral('fs')],
          ),
        ),
      });
      const statement2 = TypescriptStatementStub({
        value: ts.factory.createExpressionStatement(
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier('jest'),
              ts.factory.createIdentifier('mock'),
            ),
            undefined,
            [ts.factory.createStringLiteral('path')],
          ),
        ),
      });

      const result = sourceFilePrependStatementsTransformer({
        sourceFile,
        statements: [statement1, statement2],
        nodeFactory,
      });

      const printer = ts.createPrinter();
      const output = printer.printFile(result as unknown as ts.SourceFile);

      expect(output).toBe('jest.mock("fs");\njest.mock("path");\nconst x = 1;\n');
    });
  });

  describe('empty statements', () => {
    it('EMPTY: {empty statements array} => returns original source file', () => {
      const code = `const x = 1;`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const nodeFactory = TypescriptNodeFactoryStub({ value: ts.factory });
      const result = sourceFilePrependStatementsTransformer({
        sourceFile,
        statements: [],
        nodeFactory,
      });

      const printer = ts.createPrinter();
      const output = printer.printFile(result as unknown as ts.SourceFile);

      expect(output).toBe('const x = 1;\n');
    });
  });
});
