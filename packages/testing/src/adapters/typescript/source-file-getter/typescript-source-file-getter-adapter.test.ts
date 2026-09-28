import * as ts from 'typescript';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { typescriptSourceFileGetterAdapter } from './typescript-source-file-getter-adapter';
import { typescriptSourceFileGetterAdapterProxy } from './typescript-source-file-getter-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { TypescriptProgramStub } from '../../../contracts/typescript-program/typescript-program.stub';
import { TypescriptSourceFileStub } from '../../../contracts/typescript-source-file/typescript-source-file.stub';
import { TypescriptNodeFactoryStub } from '../../../contracts/typescript-node-factory/typescript-node-factory.stub';
import { typescriptProxyMockTransformerMiddleware } from '../../../middleware/typescript-proxy-mock-transformer/typescript-proxy-mock-transformer-middleware';

describe('typescriptSourceFileGetterAdapter', () => {
  describe('valid source file retrieval', () => {
    it('VALID: {program with real file, filePath} => returns source file', () => {
      const proxy = typescriptSourceFileGetterAdapterProxy();
      proxy.readsRealFiles();

      // Use this actual test file as input - it's a real .ts file
      const filePath = FilePathStub({ value: __filename });

      // The adapter reads `program.getSourceFile(filePath)` and nothing else, so a program that
      // answers that one lookup is the whole fixture; a real `ts.createProgram` here costs a compile.
      const heldSourceFile = ts.createSourceFile(
        filePath,
        fs.readFileSync(filePath, 'utf-8'),
        ts.ScriptTarget.Latest,
        true,
      );
      const program = TypescriptProgramStub({
        value: {
          getSourceFile: (): ts.SourceFile => heldSourceFile,
        },
      });

      const result = typescriptSourceFileGetterAdapter({ program, filePath });

      expect(result?.fileName).toBe(filePath);
    });
  });

  describe('file not in program', () => {
    it('EDGE: {program without file, file exists on disk} => parses directly', () => {
      const proxy = typescriptSourceFileGetterAdapterProxy();
      const filePath = FilePathStub({ value: '/repo/packages/other/src/cross-package.ts' });
      proxy.fileContains({ filePath, content: 'export const crossPackage = 1;' });
      const program = TypescriptProgramStub({
        value: {
          getSourceFile: (): undefined => undefined,
        },
      });

      const result = typescriptSourceFileGetterAdapter({ program, filePath });

      expect({ fileName: result?.fileName, text: result?.text }).toStrictEqual({
        fileName: filePath,
        text: 'export const crossPackage = 1;',
      });
    });

    it('INVALID: {program, nonexistent filePath} => returns undefined', () => {
      const proxy = typescriptSourceFileGetterAdapterProxy();
      const filePath = FilePathStub({ value: '/nonexistent.ts' });
      proxy.fileMissing({ filePath });
      const program = TypescriptProgramStub({
        value: {
          getSourceFile: (): undefined => undefined,
        },
      });

      const result = typescriptSourceFileGetterAdapter({ program, filePath });

      expect(result).toBe(undefined);
    });
  });

  // Lives here, not beside typescriptProxyMockTransformerMiddleware, because that file sits in
  // middleware/ (no node_modules imports allowed) while this one sits in adapters/ (which may
  // import both node_modules — real `typescript` + `fs` — AND middleware/). `proxy.readsRealFiles()`
  // is required here for the same reason the "valid source file retrieval" test above needs it:
  // ts.createProgram's default host reads through the SAME mocked `fs.readFileSync` this adapter's
  // own proxy stages, so a real multi-file compile needs the passthrough too.
  //
  // Reproduces A02 group S4's finding against the REAL collector + merge + statement-generation
  // pipeline (not hand-built MockCall stubs): a property-access proxy (the StartOrchestratorProxy
  // shape) and a bare-export proxy (the questListBrokerProxy shape) both mock the same module from
  // one entry file's transitive proxy graph. F19: the property-access mock records ONLY its own
  // object's name (objectIdentifierNames), so the merge stays SELECTIVE — a factory naming both
  // exports — rather than absorbing into a whole-module auto-mock the way an empty identifierNames
  // request used to.
  describe('composing a property-access proxy and a bare-export proxy against one real module', () => {
    it('VALID: {StartOrchestrator-shaped property-access mock, questListBroker-shaped bare-export mock, same module} => hoists one selective factory naming both, never a bare whole-module auto-mock', () => {
      const proxy = typescriptSourceFileGetterAdapterProxy();
      proxy.readsRealFiles();

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'proxy-mock-merge-'));

      fs.writeFileSync(
        path.join(tmpDir, 'fixture-module.ts'),
        [
          'export const FixtureOrchestrator = {',
          "  getValue: (): string => 'real-getValue',",
          '};',
          '',
          "export const fixtureBrokerFn = (): string => 'real-fixtureBrokerFn';",
          '',
        ].join('\n'),
      );
      fs.writeFileSync(
        path.join(tmpDir, 'object-access.proxy.ts'),
        [
          "import { FixtureOrchestrator } from './fixture-module';",
          "import { registerMock } from '@dungeonmaster/testing/register-mock';",
          '',
          'registerMock({ fn: FixtureOrchestrator.getValue });',
          '',
        ].join('\n'),
      );
      fs.writeFileSync(
        path.join(tmpDir, 'bare-export.proxy.ts'),
        [
          "import { fixtureBrokerFn } from './fixture-module';",
          "import { registerMock } from '@dungeonmaster/testing/register-mock';",
          '',
          'registerMock({ fn: fixtureBrokerFn });',
          '',
        ].join('\n'),
      );
      fs.writeFileSync(
        path.join(tmpDir, 'entry.test.ts'),
        ["import './object-access.proxy';", "import './bare-export.proxy';", ''].join('\n'),
      );

      const entryPath = FilePathStub({ value: path.join(tmpDir, 'entry.test.ts') });
      // The hoisted jest.mock() specifier mirrors the RAW import specifier the proxies wrote
      // (`./fixture-module`, no extension) resolved to an absolute path — proxyMockCollectorMiddleware
      // never appends the `.ts` extension it used to find the file on disk.
      const fixtureModuleSpecifier = path.join(tmpDir, 'fixture-module');

      // No compiled program: every proxy and module is read through the adapter's own fallback,
      // which is the path cross-package files take, and costs no type-check of the fixture.
      const entrySourceFile = ts.createSourceFile(
        entryPath,
        fs.readFileSync(entryPath, 'utf-8'),
        ts.ScriptTarget.Latest,
        true,
      );

      const program = TypescriptProgramStub({
        value: { getSourceFile: (): undefined => undefined },
      });
      const sourceFile = TypescriptSourceFileStub({ value: entrySourceFile });
      const nodeFactory = TypescriptNodeFactoryStub({ value: ts.factory });

      const transformed = typescriptProxyMockTransformerMiddleware({
        sourceFile,
        program,
        nodeFactory,
      });

      const printed = ts.createPrinter().printFile(transformed as unknown as ts.SourceFile);
      // A regression back to F19's own bug (property access forcing a whole-module auto-mock)
      // would print a BARE `jest.mock("<module>");` here instead — this pattern only matches a
      // factory-less call, so it stays empty on the correct, selective behaviour and would catch
      // the regression by turning non-empty.
      const bareAutoMockCalls = [...printed.matchAll(/jest\.mock\((['"])([^'"]+)\1\);/gu)].map(
        (match) => match[2],
      );
      // The selective factory names BOTH exports: fixtureBrokerFn flat, FixtureOrchestrator's own
      // methods individually auto-mocked rather than the whole object flattened to one jest.fn().
      const mockedModules = [...printed.matchAll(/jest\.mock\((['"])([^'"]+)\1/gu)].map(
        (match) => match[2],
      );
      const flatMockedNames = [...printed.matchAll(/(\w+): jest\.fn\(\)/gu)].map(
        (match) => match[1],
      );
      const objectAutoMockedNames = [...printed.matchAll(/(\w+): Object\.fromEntries/gu)].map(
        (match) => match[1],
      );

      fs.rmSync(tmpDir, { recursive: true, force: true });

      expect(bareAutoMockCalls).toStrictEqual([]);
      expect(mockedModules).toStrictEqual([fixtureModuleSpecifier]);
      expect(flatMockedNames).toStrictEqual(['fixtureBrokerFn']);
      expect(objectAutoMockedNames).toStrictEqual(['FixtureOrchestrator']);
    });
  });

  // F17: a test's proxy composes ONE proxy out of a barrel that re-exports MANY. Before the fix, the
  // collector followed every `export *` target of the barrel regardless of which name the composing
  // proxy actually imported, hoisting a selective mock for modules the test never asked to mock —
  // silently turning their real functions into unconfigured jest.fn()s for every caller in the file.
  describe('composing one proxy out of a barrel that re-exports several', () => {
    it("VALID: {barrel re-exports a path-like and an os-like proxy, composing proxy names only the path-like one} => hoists a mock for 'path' only, never for 'os'", () => {
      const proxy = typescriptSourceFileGetterAdapterProxy();
      proxy.readsRealFiles();

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'proxy-mock-barrel-'));

      fs.writeFileSync(
        path.join(tmpDir, 'testing.ts'),
        [
          "export * from './path-join-like.proxy';",
          "export * from './os-homedir-like.proxy';",
          '',
        ].join('\n'),
      );
      fs.writeFileSync(
        path.join(tmpDir, 'path-join-like.proxy.ts'),
        [
          "import { join } from 'path';",
          "import { registerMock } from '@dungeonmaster/testing/register-mock';",
          '',
          'export const pathJoinLikeProxy = () => {',
          '  registerMock({ fn: join });',
          '};',
          '',
        ].join('\n'),
      );
      fs.writeFileSync(
        path.join(tmpDir, 'os-homedir-like.proxy.ts'),
        [
          "import { homedir } from 'os';",
          "import { registerMock } from '@dungeonmaster/testing/register-mock';",
          '',
          'export const osHomedirLikeProxy = () => {',
          '  registerMock({ fn: homedir });',
          '};',
          '',
        ].join('\n'),
      );
      fs.writeFileSync(
        path.join(tmpDir, 'composing.proxy.ts'),
        [
          "import { pathJoinLikeProxy } from './testing';",
          '',
          'export const composingProxy = () => {',
          '  pathJoinLikeProxy();',
          '};',
          '',
        ].join('\n'),
      );
      fs.writeFileSync(
        path.join(tmpDir, 'entry.test.ts'),
        ["import './composing.proxy';", ''].join('\n'),
      );

      const entryPath = FilePathStub({ value: path.join(tmpDir, 'entry.test.ts') });

      const entrySourceFile = ts.createSourceFile(
        entryPath,
        fs.readFileSync(entryPath, 'utf-8'),
        ts.ScriptTarget.Latest,
        true,
      );

      const program = TypescriptProgramStub({
        value: { getSourceFile: (): undefined => undefined },
      });
      const sourceFile = TypescriptSourceFileStub({ value: entrySourceFile });
      const nodeFactory = TypescriptNodeFactoryStub({ value: ts.factory });

      const transformed = typescriptProxyMockTransformerMiddleware({
        sourceFile,
        program,
        nodeFactory,
      });

      const printed = ts.createPrinter().printFile(transformed as unknown as ts.SourceFile);
      const mockedModules = [...printed.matchAll(/jest\.mock\((['"])([^'"]+)\1/gu)].map(
        (match) => match[2],
      );

      fs.rmSync(tmpDir, { recursive: true, force: true });

      expect(mockedModules).toStrictEqual(['path']);
    });
  });
});
