import * as ts from 'typescript';
import { typescriptMockCallsToStatementsAdapter } from './typescript-mock-calls-to-statements-adapter';
import { typescriptMockCallsToStatementsAdapterProxy } from './typescript-mock-calls-to-statements-adapter.proxy';
import { MockCallStub } from '../../../contracts/mock-call/mock-call.stub';
import { ModuleNameStub } from '../../../contracts/module-name/module-name.stub';
import { SourceFileNameStub } from '../../../contracts/source-file-name/source-file-name.stub';
import { TypescriptNodeFactoryStub } from '../../../contracts/typescript-node-factory/typescript-node-factory.stub';
import { IdentifierNameStub } from '../../../contracts/identifier-name/identifier-name.stub';

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

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s as unknown as ts.Node, sourceFile),
      );

      expect(outputs).toStrictEqual(['// Auto-hoisted from: test.proxy.ts\njest.mock("fs");']);
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

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s as unknown as ts.Node, sourceFile),
      );

      expect(outputs).toStrictEqual([
        '// Auto-hoisted from: adapter.proxy.ts\njest.mock("axios", () => ({ get: jest.fn() }));',
      ]);
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

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s as unknown as ts.Node, sourceFile),
      );

      expect(outputs).toStrictEqual([
        '// Auto-hoisted from: test.proxy.ts\njest.mock("fs", () => ({ readFile: jest.fn().mockResolvedValue("content") }));',
      ]);
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

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s as unknown as ts.Node, sourceFile),
      );

      expect(outputs).toStrictEqual([
        '// Auto-hoisted from: test.proxy.ts\njest.mock("config", () => ({ ...actualConfig, override: true }));',
      ]);
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

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s as unknown as ts.Node, sourceFile),
      );

      expect(outputs).toStrictEqual([
        '// Auto-hoisted from: test.proxy.ts\njest.mock("api", () => ({ fetch: url => ({ json: () => ({}) }) }));',
      ]);
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

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s as unknown as ts.Node, sourceFile),
      );

      expect(outputs).toStrictEqual([
        '// Auto-hoisted from: test.proxy.ts\njest.mock("module", () => ({ myFunc }));',
      ]);
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

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s as unknown as ts.Node, sourceFile),
      );

      expect(outputs).toStrictEqual([
        '// Auto-hoisted from: test.proxy.ts\njest.mock("math", () => (({ add: jest.fn() })));',
      ]);
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

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s as unknown as ts.Node, sourceFile),
      );

      expect(outputs).toStrictEqual([
        '// Auto-hoisted from: test.proxy.ts\njest.mock("constants", () => ({ value: 42 }));',
      ]);
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

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s as unknown as ts.Node, sourceFile),
      );

      expect(outputs).toStrictEqual([
        '// Auto-hoisted from: test1.proxy.ts\njest.mock("fs");',
        '// Auto-hoisted from: test2.proxy.ts\njest.mock("path");',
      ]);
    });
  });

  describe('selective factory mock generation', () => {
    it('VALID: {mockCall with identifierNames} => returns jest.mock with selective factory', () => {
      typescriptMockCallsToStatementsAdapterProxy();

      const mockCall = MockCallStub({
        moduleName: ModuleNameStub({ value: 'fs/promises' }),
        factory: null,
        sourceFile: SourceFileNameStub({ value: 'test.proxy.ts' }),
        identifierNames: [IdentifierNameStub({ value: 'readFile' })],
      });

      const nodeFactory = TypescriptNodeFactoryStub({ value: ts.factory });
      const statements = typescriptMockCallsToStatementsAdapter({
        mockCalls: [mockCall],
        nodeFactory,
      });

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s as unknown as ts.Node, sourceFile),
      );

      expect(outputs).toStrictEqual([
        '// Auto-hoisted from: test.proxy.ts\njest.mock("fs/promises", () => ({ ...jest.requireActual("fs/promises"), readFile: jest.fn() }));',
      ]);
    });

    it('VALID: {mockCall with multiple identifierNames} => returns factory with all identifiers', () => {
      typescriptMockCallsToStatementsAdapterProxy();

      const mockCall = MockCallStub({
        moduleName: ModuleNameStub({ value: 'fs/promises' }),
        factory: null,
        sourceFile: SourceFileNameStub({ value: 'test.proxy.ts' }),
        identifierNames: [
          IdentifierNameStub({ value: 'readFile' }),
          IdentifierNameStub({ value: 'writeFile' }),
        ],
      });

      const nodeFactory = TypescriptNodeFactoryStub({ value: ts.factory });
      const statements = typescriptMockCallsToStatementsAdapter({
        mockCalls: [mockCall],
        nodeFactory,
      });

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s as unknown as ts.Node, sourceFile),
      );

      expect(outputs).toStrictEqual([
        '// Auto-hoisted from: test.proxy.ts\njest.mock("fs/promises", () => ({ ...jest.requireActual("fs/promises"), readFile: jest.fn(), writeFile: jest.fn() }));',
      ]);
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
