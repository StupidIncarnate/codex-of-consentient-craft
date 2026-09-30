import * as ts from '#gateway/npm/typescript';
import { mockCallsToStatementsTransformer } from './mock-calls-to-statements-transformer';
import { MockCallStub } from '../../contracts/mock-call/mock-call.stub';
import { SourceFileNameStub } from '../../contracts/source-file-name/source-file-name.stub';

describe('mockCallsToStatementsTransformer', () => {
  describe('valid mock calls conversion', () => {
    it('VALID: {mockCall without factory} => returns jest.mock statement', () => {
      const mockCall = MockCallStub({
        moduleName: 'fs',
        factory: null,
        sourceFile: SourceFileNameStub({ value: 'test.proxy.ts' }),
      });

      const nodeFactory = ts.factory;
      const statements = mockCallsToStatementsTransformer({
        mockCalls: [mockCall],
        nodeFactory,
      });

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s, sourceFile),
      );

      expect(outputs).toStrictEqual(['// Auto-hoisted from: test.proxy.ts\njest.mock("fs");']);
    });

    it('VALID: {mockCall with factory} => returns jest.mock with factory statement', () => {
      const mockCall = MockCallStub({
        moduleName: 'axios',
        factory: '() => ({ get: jest.fn() })',
        sourceFile: SourceFileNameStub({ value: 'adapter.proxy.ts' }),
      });

      const nodeFactory = ts.factory;
      const statements = mockCallsToStatementsTransformer({
        mockCalls: [mockCall],
        nodeFactory,
      });

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s, sourceFile),
      );

      expect(outputs).toStrictEqual([
        '// Auto-hoisted from: adapter.proxy.ts\njest.mock("axios", () => ({ get: jest.fn() }));',
      ]);
    });

    it('VALID: {factory with nested property access} => clones correctly', () => {
      const mockCall = MockCallStub({
        moduleName: 'fs',
        factory: '() => ({ readFile: jest.fn().mockResolvedValue("content") })',
        sourceFile: SourceFileNameStub({ value: 'test.proxy.ts' }),
      });

      const nodeFactory = ts.factory;
      const statements = mockCallsToStatementsTransformer({
        mockCalls: [mockCall],
        nodeFactory,
      });

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s, sourceFile),
      );

      expect(outputs).toStrictEqual([
        '// Auto-hoisted from: test.proxy.ts\njest.mock("fs", () => ({ readFile: jest.fn().mockResolvedValue("content") }));',
      ]);
    });

    it('VALID: {factory with spread assignment} => clones correctly', () => {
      const mockCall = MockCallStub({
        moduleName: 'config',
        factory: '() => ({ ...actualConfig, override: true })',
        sourceFile: SourceFileNameStub({ value: 'test.proxy.ts' }),
      });

      const nodeFactory = ts.factory;
      const statements = mockCallsToStatementsTransformer({
        mockCalls: [mockCall],
        nodeFactory,
      });

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s, sourceFile),
      );

      expect(outputs).toStrictEqual([
        '// Auto-hoisted from: test.proxy.ts\njest.mock("config", () => ({ ...actualConfig, override: true }));',
      ]);
    });

    it('VALID: {factory with arrow function parameters} => clones correctly', () => {
      const mockCall = MockCallStub({
        moduleName: 'api',
        factory: '() => ({ fetch: (url) => ({ json: () => ({}) }) })',
        sourceFile: SourceFileNameStub({ value: 'test.proxy.ts' }),
      });

      const nodeFactory = ts.factory;
      const statements = mockCallsToStatementsTransformer({
        mockCalls: [mockCall],
        nodeFactory,
      });

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s, sourceFile),
      );

      expect(outputs).toStrictEqual([
        '// Auto-hoisted from: test.proxy.ts\njest.mock("api", () => ({ fetch: url => ({ json: () => ({}) }) }));',
      ]);
    });

    it('VALID: {factory with shorthand property} => clones correctly', () => {
      const mockCall = MockCallStub({
        moduleName: 'module',
        factory: '() => ({ myFunc })',
        sourceFile: SourceFileNameStub({ value: 'test.proxy.ts' }),
      });

      const nodeFactory = ts.factory;
      const statements = mockCallsToStatementsTransformer({
        mockCalls: [mockCall],
        nodeFactory,
      });

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s, sourceFile),
      );

      expect(outputs).toStrictEqual([
        '// Auto-hoisted from: test.proxy.ts\njest.mock("module", () => ({ myFunc }));',
      ]);
    });

    it('VALID: {factory with parenthesized expression} => clones correctly', () => {
      const mockCall = MockCallStub({
        moduleName: 'math',
        factory: '() => (({ add: jest.fn() }))',
        sourceFile: SourceFileNameStub({ value: 'test.proxy.ts' }),
      });

      const nodeFactory = ts.factory;
      const statements = mockCallsToStatementsTransformer({
        mockCalls: [mockCall],
        nodeFactory,
      });

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s, sourceFile),
      );

      expect(outputs).toStrictEqual([
        '// Auto-hoisted from: test.proxy.ts\njest.mock("math", () => (({ add: jest.fn() })));',
      ]);
    });

    it('VALID: {factory with numeric literal} => clones correctly', () => {
      const mockCall = MockCallStub({
        moduleName: 'constants',
        factory: '() => ({ value: 42 })',
        sourceFile: SourceFileNameStub({ value: 'test.proxy.ts' }),
      });

      const nodeFactory = ts.factory;
      const statements = mockCallsToStatementsTransformer({
        mockCalls: [mockCall],
        nodeFactory,
      });

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s, sourceFile),
      );

      expect(outputs).toStrictEqual([
        '// Auto-hoisted from: test.proxy.ts\njest.mock("constants", () => ({ value: 42 }));',
      ]);
    });

    it('VALID: {multiple mock calls} => returns multiple statements', () => {
      const mockCalls = [
        MockCallStub({
          moduleName: 'fs',
          factory: null,
          sourceFile: SourceFileNameStub({ value: 'test1.proxy.ts' }),
        }),
        MockCallStub({
          moduleName: 'path',
          factory: null,
          sourceFile: SourceFileNameStub({ value: 'test2.proxy.ts' }),
        }),
      ];

      const nodeFactory = ts.factory;
      const statements = mockCallsToStatementsTransformer({ mockCalls, nodeFactory });

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s, sourceFile),
      );

      expect(outputs).toStrictEqual([
        '// Auto-hoisted from: test1.proxy.ts\njest.mock("fs");',
        '// Auto-hoisted from: test2.proxy.ts\njest.mock("path");',
      ]);
    });
  });

  describe('selective factory mock generation', () => {
    it('VALID: {mockCall with identifierNames} => returns jest.mock with selective factory', () => {
      const mockCall = MockCallStub({
        moduleName: 'fs/promises',
        factory: null,
        sourceFile: SourceFileNameStub({ value: 'test.proxy.ts' }),
        identifierNames: ['readFile'],
      });

      const nodeFactory = ts.factory;
      const statements = mockCallsToStatementsTransformer({
        mockCalls: [mockCall],
        nodeFactory,
      });

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s, sourceFile),
      );

      expect(outputs).toStrictEqual([
        '// Auto-hoisted from: test.proxy.ts\njest.mock("fs/promises", () => ({ ...(globalThis.__ioTrap?.("fs/promises") ?? jest.requireActual("fs/promises")), readFile: jest.fn() }));',
      ]);
    });

    it('VALID: {mockCall for process module} => uses Object.assign and Object.create instead of spread', () => {
      const mockCall = MockCallStub({
        moduleName: 'process',
        factory: null,
        sourceFile: SourceFileNameStub({ value: 'test.proxy.ts' }),
        identifierNames: ['kill'],
      });

      const nodeFactory = ts.factory;
      const statements = mockCallsToStatementsTransformer({
        mockCalls: [mockCall],
        nodeFactory,
      });

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s, sourceFile),
      );

      expect(outputs).toStrictEqual([
        '// Auto-hoisted from: test.proxy.ts\njest.mock("process", () => Object.assign(Object.create(jest.requireActual("process")), { kill: jest.fn() }));',
      ]);
    });

    it('VALID: {mockCall with multiple identifierNames} => returns factory with all identifiers', () => {
      const mockCall = MockCallStub({
        moduleName: 'fs/promises',
        factory: null,
        sourceFile: SourceFileNameStub({ value: 'test.proxy.ts' }),
        identifierNames: [
          'readFile',
          'writeFile',
        ],
      });

      const nodeFactory = ts.factory;
      const statements = mockCallsToStatementsTransformer({
        mockCalls: [mockCall],
        nodeFactory,
      });

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s, sourceFile),
      );

      expect(outputs).toStrictEqual([
        '// Auto-hoisted from: test.proxy.ts\njest.mock("fs/promises", () => ({ ...(globalThis.__ioTrap?.("fs/promises") ?? jest.requireActual("fs/promises")), readFile: jest.fn(), writeFile: jest.fn() }));',
      ]);
    });
  });

  describe('property-access (objectIdentifierNames) auto-mock generation', () => {
    it('VALID: {mockCall with objectIdentifierNames} => auto-mocks every method of the named object, not the whole module', () => {
      const mockCall = MockCallStub({
        moduleName: '@dungeonmaster/orchestrator',
        factory: null,
        sourceFile: SourceFileNameStub({ value: 'orchestration-events-state.proxy.ts' }),
        identifierNames: [],
        objectIdentifierNames: ['orchestrationEventsState'],
      });

      const nodeFactory = ts.factory;
      const statements = mockCallsToStatementsTransformer({
        mockCalls: [mockCall],
        nodeFactory,
      });

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s, sourceFile),
      );

      expect(outputs).toStrictEqual([
        '// Auto-hoisted from: orchestration-events-state.proxy.ts\njest.mock("@dungeonmaster/orchestrator", () => ({ ...(globalThis.__ioTrap?.("@dungeonmaster/orchestrator") ?? jest.requireActual("@dungeonmaster/orchestrator")), orchestrationEventsState: Object.fromEntries(Object.entries((jest.requireActual("@dungeonmaster/orchestrator")).orchestrationEventsState).map(([key, value]) => [key, typeof value === "function" ? jest.fn() : value])) }));',
      ]);
    });

    it('VALID: {mockCall with both identifierNames and objectIdentifierNames} => generates a flat property for one and a nested auto-mock for the other', () => {
      const mockCall = MockCallStub({
        moduleName: '@dungeonmaster/orchestrator',
        factory: null,
        sourceFile: SourceFileNameStub({ value: 'x.proxy.ts' }),
        identifierNames: ['questListBroker'],
        objectIdentifierNames: ['StartOrchestrator'],
      });

      const nodeFactory = ts.factory;
      const statements = mockCallsToStatementsTransformer({
        mockCalls: [mockCall],
        nodeFactory,
      });

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s, sourceFile),
      );

      expect(outputs).toStrictEqual([
        '// Auto-hoisted from: x.proxy.ts\njest.mock("@dungeonmaster/orchestrator", () => ({ ...(globalThis.__ioTrap?.("@dungeonmaster/orchestrator") ?? jest.requireActual("@dungeonmaster/orchestrator")), questListBroker: jest.fn(), StartOrchestrator: Object.fromEntries(Object.entries((jest.requireActual("@dungeonmaster/orchestrator")).StartOrchestrator).map(([key, value]) => [key, typeof value === "function" ? jest.fn() : value])) }));',
      ]);
    });

    it('VALID: {mockCall with both arrays empty, no factory} => returns a bare jest.mock() call (whole-module automock)', () => {
      const mockCall = MockCallStub({
        moduleName: '@dungeonmaster/orchestrator',
        factory: null,
        sourceFile: SourceFileNameStub({ value: 'y.proxy.ts' }),
        identifierNames: [],
        objectIdentifierNames: [],
      });

      const nodeFactory = ts.factory;
      const statements = mockCallsToStatementsTransformer({
        mockCalls: [mockCall],
        nodeFactory,
      });

      const printer = ts.createPrinter();
      const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest);
      const outputs = statements.map((s) =>
        printer.printNode(ts.EmitHint.Unspecified, s, sourceFile),
      );

      expect(outputs).toStrictEqual([
        '// Auto-hoisted from: y.proxy.ts\njest.mock("@dungeonmaster/orchestrator");',
      ]);
    });
  });

  describe('empty mock calls', () => {
    it('EMPTY: {empty mockCalls array} => returns empty array', () => {
      const nodeFactory = ts.factory;
      const statements = mockCallsToStatementsTransformer({
        mockCalls: [],
        nodeFactory,
      });

      expect(statements).toStrictEqual([]);
    });
  });
});
