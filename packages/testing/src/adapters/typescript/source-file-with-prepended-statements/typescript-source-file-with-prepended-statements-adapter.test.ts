import * as ts from 'typescript';
import { typescriptSourceFileWithPrependedStatementsAdapter } from './typescript-source-file-with-prepended-statements-adapter';
import { typescriptSourceFileWithPrependedStatementsAdapterProxy } from './typescript-source-file-with-prepended-statements-adapter.proxy';
import { TypescriptSourceFileStub } from '../../../contracts/typescript-source-file/typescript-source-file.stub';
import { TypescriptNodeFactoryStub } from '../../../contracts/typescript-node-factory/typescript-node-factory.stub';
import { TypescriptStatementStub } from '../../../contracts/typescript-statement/typescript-statement.stub';

describe('typescriptSourceFileWithPrependedStatementsAdapter', () => {
  describe('valid statement prepending', () => {
    it('VALID: {sourceFile, statements} => returns source file with prepended statements', () => {
      typescriptSourceFileWithPrependedStatementsAdapterProxy();

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

      const result = typescriptSourceFileWithPrependedStatementsAdapter({
        sourceFile,
        statements: [mockStatement],
        nodeFactory,
      });

      const printer = ts.createPrinter();
      const output = printer.printFile(result as unknown as ts.SourceFile);

      expect(output).toMatch(/jest\.mock\(['"]fs['"]\)/u);
      expect(output).toMatch(/describe/u);
      expect(output.indexOf('jest.mock')).toBeLessThan(output.indexOf('describe'));
    });

    it('VALID: {multiple statements} => prepends all in order', () => {
      typescriptSourceFileWithPrependedStatementsAdapterProxy();

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

      const result = typescriptSourceFileWithPrependedStatementsAdapter({
        sourceFile,
        statements: [statement1, statement2],
        nodeFactory,
      });

      const printer = ts.createPrinter();
      const output = printer.printFile(result as unknown as ts.SourceFile);

      expect(output).toMatch(/jest\.mock\(['"]fs['"]\)/u);
      expect(output).toMatch(/jest\.mock\(['"]path['"]\)/u);
      expect(output.indexOf('fs')).toBeLessThan(output.indexOf('path'));
    });
  });

  describe('empty statements', () => {
    it('EMPTY: {empty statements array} => returns original source file', () => {
      typescriptSourceFileWithPrependedStatementsAdapterProxy();

      const code = `const x = 1;`;
      const tsSourceFile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.Latest, true);
      const sourceFile = TypescriptSourceFileStub({ value: tsSourceFile });

      const nodeFactory = TypescriptNodeFactoryStub({ value: ts.factory });
      const result = typescriptSourceFileWithPrependedStatementsAdapter({
        sourceFile,
        statements: [],
        nodeFactory,
      });

      const printer = ts.createPrinter();
      const output = printer.printFile(result as unknown as ts.SourceFile);

      expect(output).toMatch(/const x = 1/u);
      expect(output).not.toMatch(/jest\.mock/u);
    });
  });
});
