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

      // The adapter reads `program.getSourceFile(filePath)` and nothing else, so what this proves
      // is that a REAL program over a real file on disk answers that lookup — no ambient
      // declaration takes any part in it. Both options exist to keep those declarations out of the
      // program: omitting `types` makes TypeScript pull in every package under node_modules/@types
      // (445 source files, 556ms), and `noLib` drops the default lib chain on top of that
      // (30 files and 95ms, against 23 files and 31ms). The root file and its own module graph are
      // what remain, which is the whole fixture.
      const tsProgram = ts.createProgram([filePath], {
        skipLibCheck: true,
        noEmit: true,
        types: [],
        noLib: true,
      });
      const program = TypescriptProgramStub({ value: tsProgram });

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
  // one entry file's transitive proxy graph.
  describe('composing a property-access proxy and a bare-export proxy against one real module', () => {
    it('VALID: {StartOrchestrator-shaped property-access mock, questListBroker-shaped bare-export mock, same module} => hoists exactly one full auto-mock jest.mock() call, not a selective one', () => {
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
      const objectAccessProxyPath = path.join(tmpDir, 'object-access.proxy.ts');
      const bareExportProxyPath = path.join(tmpDir, 'bare-export.proxy.ts');
      const fixtureModulePath = path.join(tmpDir, 'fixture-module.ts');
      // The hoisted jest.mock() specifier mirrors the RAW import specifier the proxies wrote
      // (`./fixture-module`, no extension) resolved to an absolute path — proxyMockCollectorMiddleware
      // never appends the `.ts` extension it used to find the file on disk.
      const fixtureModuleSpecifier = path.join(tmpDir, 'fixture-module');

      const tsProgram = ts.createProgram(
        [entryPath, objectAccessProxyPath, bareExportProxyPath, fixtureModulePath],
        { skipLibCheck: true, noEmit: true, types: [], noLib: true },
      );
      // A missing entry source file surfaces as a Zod throw from TypescriptSourceFileStub's own
      // .parse() below — no if/guard needed here (jest/no-conditional-in-test bans those in a
      // test body, `??` included).
      const entrySourceFile = tsProgram.getSourceFile(entryPath);

      const program = TypescriptProgramStub({ value: tsProgram });
      const sourceFile = TypescriptSourceFileStub({ value: entrySourceFile });
      const nodeFactory = TypescriptNodeFactoryStub({ value: ts.factory });

      const transformed = typescriptProxyMockTransformerMiddleware({
        sourceFile,
        program,
        nodeFactory,
      });

      const printed = ts.createPrinter().printFile(transformed as unknown as ts.SourceFile);
      // A bare `jest.mock("<module>")` — no second argument — IS the full auto-mock decision:
      // Jest's automock replaces every export with a jest.fn(), objects (FixtureOrchestrator)
      // mocked recursively, which already covers the bare export too. The buggy merge instead
      // emitted `jest.mock("<module>", () => ({...}))` (a selective spread-real factory naming
      // only fixtureBrokerFn), which this pattern does NOT match — so a regression back to that
      // shape drives `bareAutoMockCalls` to `[]` and fails the assertion below.
      const bareAutoMockCalls = [...printed.matchAll(/jest\.mock\((['"])([^'"]+)\1\)/gu)].map(
        (match) => match[2],
      );

      fs.rmSync(tmpDir, { recursive: true, force: true });

      expect(bareAutoMockCalls).toStrictEqual([fixtureModuleSpecifier]);
    });
  });
});
