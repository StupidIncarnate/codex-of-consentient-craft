import * as ts from 'typescript';
import { typescriptMockCallsToStatementsAdapter } from './typescript-mock-calls-to-statements-adapter';
import { typescriptMockCallsToStatementsAdapterProxy } from './typescript-mock-calls-to-statements-adapter.proxy';
import { MockCallStub } from '../../../contracts/mock-call/mock-call.stub';
import { ModuleNameStub } from '../../../contracts/module-name/module-name.stub';
import { SourceFileNameStub } from '../../../contracts/source-file-name/source-file-name.stub';
import { TypescriptNodeFactoryStub } from '../../../contracts/typescript-node-factory/typescript-node-factory.stub';

describe('typescriptMockCallsToStatementsAdapter', () => {
  describe('valid mock calls conversion', () => {
    it('VALID: {mockCall without factory} => returns jest.mock statement', () => {
      typescriptMockCallsToStatementsAdapterProxy();

      const mockCall = MockCallStub({
        moduleName: ModuleNameStub({ value: 'fs' }),
        factory: null,
        sourceFile: SourceFileNameStub({ value: 'test.proxy.ts' }),
      });

      const nodeFactory = TypescriptNodeFactoryStub({ value: ts.factory });
      const statements = typescriptMockCallsToStatementsAdapter({
        mockCalls: [mockCall],
        nodeFactory,
      });

      expect(statements).toHaveLength(1);

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const output = printer.printNode(
        ts.EmitHint.Unspecified,
        statements[0] as unknown as ts.Node,
        sourceFile,
      );

      expect(output).toMatch(/jest\.mock\(['"]fs['"]\)/u);
      expect(output).toMatch(/Auto-hoisted from.*test\.proxy\.ts/u);
    });

    it('VALID: {mockCall with factory} => returns jest.mock with factory statement', () => {
      typescriptMockCallsToStatementsAdapterProxy();

      const mockCall = MockCallStub({
        moduleName: ModuleNameStub({ value: 'axios' }),
        factory: '() => ({ get: jest.fn() })',
        sourceFile: SourceFileNameStub({ value: 'adapter.proxy.ts' }),
      });

      const nodeFactory = TypescriptNodeFactoryStub({ value: ts.factory });
      const statements = typescriptMockCallsToStatementsAdapter({
        mockCalls: [mockCall],
        nodeFactory,
      });

      expect(statements).toHaveLength(1);

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const output = printer.printNode(
        ts.EmitHint.Unspecified,
        statements[0] as unknown as ts.Node,
        sourceFile,
      );

      expect(output).toMatch(/jest\.mock\(['"]axios['"]/u);
      expect(output).toMatch(/get.*jest\.fn/u);
    });

    it('VALID: {multiple mock calls} => returns multiple statements', () => {
      typescriptMockCallsToStatementsAdapterProxy();

      const mockCalls = [
        MockCallStub({
          moduleName: ModuleNameStub({ value: 'fs' }),
          factory: null,
          sourceFile: SourceFileNameStub({ value: 'test1.proxy.ts' }),
        }),
        MockCallStub({
          moduleName: ModuleNameStub({ value: 'path' }),
          factory: null,
          sourceFile: SourceFileNameStub({ value: 'test2.proxy.ts' }),
        }),
      ];

      const nodeFactory = TypescriptNodeFactoryStub({ value: ts.factory });
      const statements = typescriptMockCallsToStatementsAdapter({ mockCalls, nodeFactory });

      expect(statements).toHaveLength(2);
    });
  });

  describe('empty mock calls', () => {
    it('EMPTY: {empty mockCalls array} => returns empty array', () => {
      typescriptMockCallsToStatementsAdapterProxy();

      const nodeFactory = TypescriptNodeFactoryStub({ value: ts.factory });
      const statements = typescriptMockCallsToStatementsAdapter({
        mockCalls: [],
        nodeFactory,
      });

      expect(statements).toStrictEqual([]);
    });
  });
});
