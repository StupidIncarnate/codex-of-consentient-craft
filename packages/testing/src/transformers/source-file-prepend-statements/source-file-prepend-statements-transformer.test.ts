import * as ts from '#gateway/npm/typescript';
import { sourceFilePrependStatementsTransformer } from './source-file-prepend-statements-transformer';

describe('sourceFilePrependStatementsTransformer', () => {
  describe('valid statement prepending', () => {
    it('VALID: {sourceFile, statements} => returns source file with prepended statements', () => {
      const code = `describe('test', () => {});`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = tsSourceFile;

      const nodeFactory = ts.factory;
      const mockStatement = ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier('jest'),
            ts.factory.createIdentifier('mock'),
          ),
          undefined,
          [ts.factory.createStringLiteral('fs')],
        ),
      );

      const result = sourceFilePrependStatementsTransformer({
        sourceFile,
        statements: [mockStatement],
        nodeFactory,
      });

      const printer = ts.createPrinter();
      const output = printer.printFile(result);

      expect(output).toBe('jest.mock("fs");\ndescribe(\'test\', () => { });\n');
    });

    it('VALID: {multiple statements} => prepends all in order', () => {
      const code = `const x = 1;`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = tsSourceFile;

      const nodeFactory = ts.factory;
      const statement1 = ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier('jest'),
            ts.factory.createIdentifier('mock'),
          ),
          undefined,
          [ts.factory.createStringLiteral('fs')],
        ),
      );
      const statement2 = ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier('jest'),
            ts.factory.createIdentifier('mock'),
          ),
          undefined,
          [ts.factory.createStringLiteral('path')],
        ),
      );

      const result = sourceFilePrependStatementsTransformer({
        sourceFile,
        statements: [statement1, statement2],
        nodeFactory,
      });

      const printer = ts.createPrinter();
      const output = printer.printFile(result);

      expect(output).toBe('jest.mock("fs");\njest.mock("path");\nconst x = 1;\n');
    });
  });

  describe('empty statements', () => {
    it('EMPTY: {empty statements array} => returns original source file', () => {
      const code = `const x = 1;`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = tsSourceFile;

      const nodeFactory = ts.factory;
      const result = sourceFilePrependStatementsTransformer({
        sourceFile,
        statements: [],
        nodeFactory,
      });

      const printer = ts.createPrinter();
      const output = printer.printFile(result);

      expect(output).toBe('const x = 1;\n');
    });
  });
});
