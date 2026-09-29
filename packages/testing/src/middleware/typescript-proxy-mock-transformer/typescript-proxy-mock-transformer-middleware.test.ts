import * as ts from '#gateway/npm/typescript';
import { typescriptProxyMockTransformerMiddleware } from './typescript-proxy-mock-transformer-middleware';
import { typescriptProxyMockTransformerMiddlewareProxy } from './typescript-proxy-mock-transformer-middleware.proxy';
import { TypescriptSourceFileStub } from '../../contracts/typescript-source-file/typescript-source-file.stub';
import { TypescriptProgramStub } from '../../contracts/typescript-program/typescript-program.stub';
import { TypescriptNodeFactoryStub } from '../../contracts/typescript-node-factory/typescript-node-factory.stub';

describe('typescriptProxyMockTransformerMiddleware', () => {
  describe('no proxy imports', () => {
    it('VALID: {sourceFile without proxy imports} => returns unchanged sourceFile', () => {
      typescriptProxyMockTransformerMiddlewareProxy();

      const sourceFile = TypescriptSourceFileStub({ value: { fileName: 'test.test.ts' } });
      const program = TypescriptProgramStub({
        value: {
          getSourceFile: (): undefined => undefined,
        },
      });
      const nodeFactory = TypescriptNodeFactoryStub({ value: {} });

      const result = typescriptProxyMockTransformerMiddleware({
        sourceFile,
        program,
        nodeFactory,
      });

      expect(result).toStrictEqual(sourceFile);
    });
  });

  // A02 group S4 against the real collector + merge + statement-generation pipeline: a
  // property-access proxy (the StartOrchestratorProxy shape) and a bare-export proxy (the
  // questListBrokerProxy shape) both mock the same module from one entry file's transitive proxy
  // graph. F19: the property-access mock records ONLY its own object's name, so the merge stays
  // SELECTIVE — one factory naming both exports — rather than a whole-module auto-mock.
  describe('composing a property-access proxy and a bare-export proxy against one module', () => {
    it('VALID: {StartOrchestrator-shaped property-access mock, questListBroker-shaped bare-export mock, same module} => hoists one selective factory naming both, never a bare whole-module auto-mock', () => {
      const proxy = typescriptProxyMockTransformerMiddlewareProxy();
      const objectAccessProxyPath = '/repo/fixture/object-access.proxy.ts';
      const bareExportProxyPath = '/repo/fixture/bare-export.proxy.ts';
      proxy.setupFileContains({
        filePath: objectAccessProxyPath,
        content: [
          "import { FixtureOrchestrator } from './fixture-module';",
          "import { registerMock } from '@dungeonmaster/testing/register-mock';",
          '',
          'registerMock({ fn: FixtureOrchestrator.getValue });',
          '',
        ].join('\n'),
      });
      proxy.setupFileContains({
        filePath: bareExportProxyPath,
        content: [
          "import { fixtureBrokerFn } from './fixture-module';",
          "import { registerMock } from '@dungeonmaster/testing/register-mock';",
          '',
          'registerMock({ fn: fixtureBrokerFn });',
          '',
        ].join('\n'),
      });
      proxy.setupFilesOnDisk({ filePaths: [objectAccessProxyPath, bareExportProxyPath] });

      const entrySourceFile = ts.createSourceFile(
        '/repo/fixture/entry.test.ts',
        ["import './object-access.proxy';", "import './bare-export.proxy';", ''].join('\n'),
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
      // Matches only a factory-less call, so it stays empty on the selective behaviour and turns
      // non-empty on a regression to a whole-module auto-mock.
      const bareAutoMockCalls = [...printed.matchAll(/jest\.mock\((['"])([^'"]+)\1\);/gu)].map(
        (match) => match[2],
      );
      // The hoisted specifier is the RAW import specifier resolved to an absolute path, with no
      // extension appended.
      const mockedModules = [...printed.matchAll(/jest\.mock\((['"])([^'"]+)\1/gu)].map(
        (match) => match[2],
      );
      const flatMockedNames = [...printed.matchAll(/(\w+): jest\.fn\(\)/gu)].map(
        (match) => match[1],
      );
      const objectAutoMockedNames = [...printed.matchAll(/(\w+): Object\.fromEntries/gu)].map(
        (match) => match[1],
      );

      expect(bareAutoMockCalls).toStrictEqual([]);
      expect(mockedModules).toStrictEqual(['/repo/fixture/fixture-module']);
      expect(flatMockedNames).toStrictEqual(['fixtureBrokerFn']);
      expect(objectAutoMockedNames).toStrictEqual(['FixtureOrchestrator']);
    });
  });

  // F17: a test's proxy composes ONE proxy out of a barrel that re-exports MANY. The collector
  // follows a barrel's `export *` targets only for the names the composing proxy imported, so a
  // module the test never asked to mock keeps its real functions.
  describe('composing one proxy out of a barrel that re-exports several', () => {
    it("VALID: {barrel re-exports a path-like and an os-like proxy, composing proxy names only the path-like one} => hoists a mock for 'path' only, never for 'os'", () => {
      const proxy = typescriptProxyMockTransformerMiddlewareProxy();
      const barrelPath = '/repo/fixture/testing.ts';
      const pathJoinProxyPath = '/repo/fixture/path-join-like.proxy.ts';
      const osHomedirProxyPath = '/repo/fixture/os-homedir-like.proxy.ts';
      const composingProxyPath = '/repo/fixture/composing.proxy.ts';
      proxy.setupFileContains({
        filePath: barrelPath,
        content: [
          "export * from './path-join-like.proxy';",
          "export * from './os-homedir-like.proxy';",
          '',
        ].join('\n'),
      });
      proxy.setupFileContains({
        filePath: pathJoinProxyPath,
        content: [
          "import { join } from 'path';",
          "import { registerMock } from '@dungeonmaster/testing/register-mock';",
          '',
          'export const pathJoinLikeProxy = () => {',
          '  registerMock({ fn: join });',
          '};',
          '',
        ].join('\n'),
      });
      proxy.setupFileContains({
        filePath: osHomedirProxyPath,
        content: [
          "import { homedir } from 'os';",
          "import { registerMock } from '@dungeonmaster/testing/register-mock';",
          '',
          'export const osHomedirLikeProxy = () => {',
          '  registerMock({ fn: homedir });',
          '};',
          '',
        ].join('\n'),
      });
      proxy.setupFileContains({
        filePath: composingProxyPath,
        content: [
          "import { pathJoinLikeProxy } from './testing';",
          '',
          'export const composingProxy = () => {',
          '  pathJoinLikeProxy();',
          '};',
          '',
        ].join('\n'),
      });
      proxy.setupFilesOnDisk({
        filePaths: [barrelPath, pathJoinProxyPath, osHomedirProxyPath, composingProxyPath],
      });

      const entrySourceFile = ts.createSourceFile(
        '/repo/fixture/entry.test.ts',
        ["import './composing.proxy';", ''].join('\n'),
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

      expect(mockedModules).toStrictEqual(['path']);
    });
  });
});
