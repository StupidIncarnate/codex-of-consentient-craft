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

      expect(outputs).toStrictEqual([
        expect.stringMatching(
          /^[\s\S]*uto-hoisted from[\s\S]*test\.proxy\.ts[\s\S]*jest\.mock\(['"]fs['"]\)/u,
        ),
      ]);
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
        expect.stringMatching(/^[\s\S]*jest\.mock\(['"]axios['"][\s\S]*et[\s\S]*jest\.fn/u),
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
        expect.stringMatching(
          /^[\s\S]*jest\.mock\(['"]fs['"][\s\S]*eadFile[\s\S]*jest\.fn[\s\S]*ockResolvedValue/u,
        ),
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
        expect.stringMatching(/^[\s\S]*\.\.\.actualConfig[\s\S]*verride[\s\S]*true/u),
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

      expect(outputs).toStrictEqual([expect.stringMatching(/^[\s\S]*fetch[\s\S]*url[\s\S]*son/u)]);
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

      expect(outputs).toStrictEqual([expect.stringMatching(/^[\s\S]*myFunc/u)]);
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

      expect(outputs).toStrictEqual([expect.stringMatching(/^[\s\S]*add.*jest\.fn/u)]);
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

      expect(outputs).toStrictEqual([expect.stringMatching(/^[\s\S]*value.*42/u)]);
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
        expect.stringMatching(/^[\s\S]*jest\.mock\(['"]fs['"]\)/u),
        expect.stringMatching(/^[\s\S]*jest\.mock\(['"]path['"]\)/u),
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
        expect.stringMatching(
          /^[\s\S]*jest\.mock\(["']fs\/promises["'],\s*\(\)\s*=>\s*\([\s\S]*\.\.\.jest\.requireActual\(["']fs\/promises["']\)[\s\S]*readFile:\s*jest\.fn\(\)/u,
        ),
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
        expect.stringMatching(
          /^[\s\S]*jest\.mock\(["']fs\/promises["'][\s\S]*requireActual[\s\S]*readFile:\s*jest\.fn\(\)[\s\S]*writeFile:\s*jest\.fn\(\)/u,
        ),
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
