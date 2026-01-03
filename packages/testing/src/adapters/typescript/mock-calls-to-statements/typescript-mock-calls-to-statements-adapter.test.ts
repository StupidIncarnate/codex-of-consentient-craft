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

    it('VALID: {factory with nested property access} => clones correctly', () => {
      typescriptMockCallsToStatementsAdapterProxy();

      const mockCall = MockCallStub({
        moduleName: ModuleNameStub({ value: 'fs' }),
        factory: '() => ({ readFile: jest.fn().mockResolvedValue("content") })',
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

      expect(output).toMatch(/jest\.mock\(['"]fs['"]/u);
      expect(output).toMatch(/readFile.*jest\.fn/u);
      expect(output).toMatch(/mockResolvedValue/u);
    });

    it('VALID: {factory with spread assignment} => clones correctly', () => {
      typescriptMockCallsToStatementsAdapterProxy();

      const mockCall = MockCallStub({
        moduleName: ModuleNameStub({ value: 'config' }),
        factory: '() => ({ ...actualConfig, override: true })',
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

      expect(output).toMatch(/\.\.\.actualConfig/u);
      expect(output).toMatch(/override.*true/u);
    });

    it('VALID: {factory with arrow function parameters} => clones correctly', () => {
      typescriptMockCallsToStatementsAdapterProxy();

      const mockCall = MockCallStub({
        moduleName: ModuleNameStub({ value: 'api' }),
        factory: '() => ({ fetch: (url) => ({ json: () => ({}) }) })',
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

      expect(output).toMatch(/fetch.*url/u);
      expect(output).toMatch(/json/u);
    });

    it('VALID: {factory with shorthand property} => clones correctly', () => {
      typescriptMockCallsToStatementsAdapterProxy();

      const mockCall = MockCallStub({
        moduleName: ModuleNameStub({ value: 'module' }),
        factory: '() => ({ myFunc })',
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

      expect(output).toMatch(/myFunc/u);
    });

    it('VALID: {factory with parenthesized expression} => clones correctly', () => {
      typescriptMockCallsToStatementsAdapterProxy();

      const mockCall = MockCallStub({
        moduleName: ModuleNameStub({ value: 'math' }),
        factory: '() => (({ add: jest.fn() }))',
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

      expect(output).toMatch(/add.*jest\.fn/u);
    });

    it('VALID: {factory with numeric literal} => clones correctly', () => {
      typescriptMockCallsToStatementsAdapterProxy();

      const mockCall = MockCallStub({
        moduleName: ModuleNameStub({ value: 'constants' }),
        factory: '() => ({ value: 42 })',
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

      expect(output).toMatch(/value.*42/u);
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
