import { proxyMockCollectorMiddleware } from './proxy-mock-collector-middleware';
import { proxyMockCollectorMiddlewareProxy } from './proxy-mock-collector-middleware.proxy';
import { FilePathStub } from '../../contracts/file-path/file-path.stub';
import { IdentifierNameStub } from '../../contracts/identifier-name/identifier-name.stub';
import { ProgramStub } from '#gateway/npm/typescript/program/program.stub';

const NoProgramSourceFileStub = (): ReturnType<typeof ProgramStub> =>
  ProgramStub({ code: '', fileName: '/repo/empty-program.ts' });

describe('proxyMockCollectorMiddleware', () => {
  describe('invalid program', () => {
    it('VALID: {program with no source file} => returns empty array', () => {
      const proxy = proxyMockCollectorMiddlewareProxy();
      const proxyFilePath = FilePathStub({ value: '/nonexistent.proxy.ts' });
      proxy.setupProxyFileMissing({ proxyFilePath });

      const program = NoProgramSourceFileStub();

      const result = proxyMockCollectorMiddleware({ proxyFilePath, program });

      expect(result).toStrictEqual([]);
    });
  });

  // F17: a barrel re-exporting many proxies must collect only the ones the composing proxy actually
  // named-imports, not every file the barrel star-reexports — see this suite's own header for why an
  // over-collected `registerMock({fn: X})` silently breaks `X` for callers who never asked to mock it.
  describe('barrel fan-out', () => {
    it("VALID: {composing proxy names ONLY one of a barrel's two re-exports} => collects that target's mock, not the unrelated target's", () => {
      const proxy = proxyMockCollectorMiddlewareProxy();
      const barrelPath = FilePathStub({ value: '/repo/packages/shared/testing.ts' });
      const pathJoinProxyPath = FilePathStub({
        value: '/repo/packages/shared/src/path-join-adapter.proxy.ts',
      });
      const osHomedirProxyPath = FilePathStub({
        value: '/repo/packages/shared/src/os-homedir-adapter.proxy.ts',
      });

      proxy.setupFileContains({
        filePath: barrelPath,
        content: [
          "export * from './src/path-join-adapter.proxy';",
          "export * from './src/os-homedir-adapter.proxy';",
        ].join('\n'),
      });
      proxy.setupFileContains({
        filePath: pathJoinProxyPath,
        content: [
          "import { join } from 'path';",
          "import { registerMock } from '@dungeonmaster/testing/register-mock';",
          '',
          'export const pathJoinAdapterProxy = () => {',
          '  registerMock({ fn: join });',
          '};',
        ].join('\n'),
      });
      proxy.setupFileContains({
        filePath: osHomedirProxyPath,
        content: [
          "import { homedir } from 'os';",
          "import { registerMock } from '@dungeonmaster/testing/register-mock';",
          '',
          'export const osHomedirAdapterProxy = () => {',
          '  registerMock({ fn: homedir });',
          '};',
        ].join('\n'),
      });
      proxy.setupFilesOnDisk({ filePaths: [pathJoinProxyPath, osHomedirProxyPath] });

      const requestedNames = [IdentifierNameStub({ value: 'pathJoinAdapterProxy' })];

      const result = proxyMockCollectorMiddleware({
        proxyFilePath: barrelPath,
        program: NoProgramSourceFileStub(),
        requestedNames,
      });

      expect(result).toStrictEqual([
        {
          moduleName: 'path',
          factory: null,
          sourceFile: pathJoinProxyPath,
          identifierNames: ['join'],
          objectIdentifierNames: [],
        },
      ]);
    });

    it("VALID: {composing proxy imports the barrel with NO name filter (namespace import)} => collects every re-exported target's mock", () => {
      const proxy = proxyMockCollectorMiddlewareProxy();
      const barrelPath = FilePathStub({ value: '/repo/packages/shared/testing.ts' });
      const pathJoinProxyPath = FilePathStub({
        value: '/repo/packages/shared/src/path-join-adapter.proxy.ts',
      });
      const osHomedirProxyPath = FilePathStub({
        value: '/repo/packages/shared/src/os-homedir-adapter.proxy.ts',
      });

      proxy.setupFileContains({
        filePath: barrelPath,
        content: [
          "export * from './src/path-join-adapter.proxy';",
          "export * from './src/os-homedir-adapter.proxy';",
        ].join('\n'),
      });
      proxy.setupFileContains({
        filePath: pathJoinProxyPath,
        content: [
          "import { join } from 'path';",
          "import { registerMock } from '@dungeonmaster/testing/register-mock';",
          '',
          'export const pathJoinAdapterProxy = () => {',
          '  registerMock({ fn: join });',
          '};',
        ].join('\n'),
      });
      proxy.setupFileContains({
        filePath: osHomedirProxyPath,
        content: [
          "import { homedir } from 'os';",
          "import { registerMock } from '@dungeonmaster/testing/register-mock';",
          '',
          'export const osHomedirAdapterProxy = () => {',
          '  registerMock({ fn: homedir });',
          '};',
        ].join('\n'),
      });
      proxy.setupFilesOnDisk({ filePaths: [pathJoinProxyPath, osHomedirProxyPath] });

      const result = proxyMockCollectorMiddleware({
        proxyFilePath: barrelPath,
        program: NoProgramSourceFileStub(),
        requestedNames: null,
      });

      expect([...result].sort((a, b) => a.moduleName.localeCompare(b.moduleName))).toStrictEqual([
        {
          moduleName: 'os',
          factory: null,
          sourceFile: osHomedirProxyPath,
          identifierNames: ['homedir'],
          objectIdentifierNames: [],
        },
        {
          moduleName: 'path',
          factory: null,
          sourceFile: pathJoinProxyPath,
          identifierNames: ['join'],
          objectIdentifierNames: [],
        },
      ]);
    });
  });
});
