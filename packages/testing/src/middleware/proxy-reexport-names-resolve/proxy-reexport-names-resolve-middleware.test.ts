import { proxyReexportNamesResolveMiddleware } from './proxy-reexport-names-resolve-middleware';
import { proxyReexportNamesResolveMiddlewareProxy } from './proxy-reexport-names-resolve-middleware.proxy';
import { ProgramStub } from '#gateway/npm/typescript/program/program.stub';

const NoProgramSourceFileStub = (): ReturnType<typeof ProgramStub> =>
  ProgramStub({ code: '', fileName: '/repo/unrelated-to-any-tested-path.ts' });

describe('proxyReexportNamesResolveMiddleware', () => {
  describe('local declarations', () => {
    it('VALID: {module defines the requested name locally} => returns the matched name', () => {
      const proxy = proxyReexportNamesResolveMiddlewareProxy();
      const filePath = '/repo/packages/shared/src/path-join-adapter.proxy.ts';
      proxy.setupFileContains({
        filePath,
        content: 'export const pathJoinAdapterProxy = () => ({});',
      });
      const requestedName = 'pathJoinAdapterProxy';

      const result = proxyReexportNamesResolveMiddleware({
        filePath,
        candidateNames: [requestedName],
        program: NoProgramSourceFileStub(),
      });

      expect(result).toStrictEqual(['pathJoinAdapterProxy']);
    });
  });

  describe('star reexport chains', () => {
    it('VALID: {barrel star-reexports two targets, each defining one requested name} => returns both, found through each target', () => {
      const proxy = proxyReexportNamesResolveMiddlewareProxy();
      const barrelPath = '/repo/packages/shared/testing.ts';
      const targetAPath = '/repo/packages/shared/src/a.proxy.ts';
      const targetBPath = '/repo/packages/shared/src/b.proxy.ts';
      proxy.setupFileContains({
        filePath: barrelPath,
        content: "export * from './src/a.proxy';\nexport * from './src/b.proxy';\n",
      });
      proxy.setupFileContains({ filePath: targetAPath, content: 'export const nameA = 1;' });
      proxy.setupFileContains({ filePath: targetBPath, content: 'export const nameB = 2;' });
      proxy.setupFilesOnDisk({ filePaths: [targetAPath, targetBPath] });
      const nameA = 'nameA';
      const nameB = 'nameB';

      const result = proxyReexportNamesResolveMiddleware({
        filePath: barrelPath,
        candidateNames: [nameA, nameB],
        program: NoProgramSourceFileStub(),
      });

      expect([...result].sort()).toStrictEqual(['nameA', 'nameB']);
    });

    it("EMPTY: {requested name matches a target's export, but the barrel's export clause names a DIFFERENT export} => returns empty, target never searched", () => {
      const proxy = proxyReexportNamesResolveMiddlewareProxy();
      const barrelPath = '/repo/packages/shared/testing.ts';
      const targetPath = '/repo/packages/shared/src/x.proxy.ts';
      proxy.setupFileContains({
        filePath: barrelPath,
        content: "export { onlyThis } from './src/x.proxy';\n",
      });
      proxy.setupFileContains({
        filePath: targetPath,
        content: 'export const onlyThis = 1;\nexport const somethingElse = 2;',
      });
      proxy.setupFilesOnDisk({ filePaths: [targetPath] });
      const requestedName = 'somethingElse';

      const result = proxyReexportNamesResolveMiddleware({
        filePath: barrelPath,
        candidateNames: [requestedName],
        program: NoProgramSourceFileStub(),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('no match anywhere', () => {
    it('EMPTY: {no reexport target defines the requested name} => returns empty array', () => {
      const proxy = proxyReexportNamesResolveMiddlewareProxy();
      const barrelPath = '/repo/packages/shared/testing.ts';
      const targetPath = '/repo/packages/shared/src/a.proxy.ts';
      proxy.setupFileContains({
        filePath: barrelPath,
        content: "export * from './src/a.proxy';\n",
      });
      proxy.setupFileContains({ filePath: targetPath, content: 'export const nameA = 1;' });
      proxy.setupFilesOnDisk({ filePaths: [targetPath] });
      const requestedName = 'neverDefined';

      const result = proxyReexportNamesResolveMiddleware({
        filePath: barrelPath,
        candidateNames: [requestedName],
        program: NoProgramSourceFileStub(),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('empty candidate set', () => {
    it('EMPTY: {no candidateNames} => returns empty array', () => {
      proxyReexportNamesResolveMiddlewareProxy();
      const filePath = '/repo/packages/shared/testing.ts';

      const result = proxyReexportNamesResolveMiddleware({
        filePath,
        candidateNames: [],
        program: NoProgramSourceFileStub(),
      });

      expect(result).toStrictEqual([]);
    });
  });
});
