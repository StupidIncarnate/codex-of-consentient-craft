import * as ts from '#gateway/npm/typescript';
import { proxyMockCallsCollectMiddleware } from './proxy-mock-calls-collect-middleware';
import { proxyMockCallsCollectMiddlewareProxy } from './proxy-mock-calls-collect-middleware.proxy';

describe('proxyMockCallsCollectMiddleware', () => {
  describe('no proxy imports', () => {
    it('EMPTY: {test file imports no proxy} => returns []', () => {
      const proxy = proxyMockCallsCollectMiddlewareProxy();
      proxy.setupFilesOnDisk({ filePaths: [] });
      const sourceFile = ts.createSourceFile(
        '/repo/fixture/entry.test.ts',
        ["import { join } from 'path';", ''].join('\n'),
        ts.ScriptTarget.Latest,
        true,
      );

      const result = proxyMockCallsCollectMiddleware({ sourceFile, program: undefined });

      expect(result).toStrictEqual([]);
    });
  });

  describe('a proxy import that resolves to no file', () => {
    it('EMPTY: {proxy import names a file not on disk} => returns []', () => {
      const proxy = proxyMockCallsCollectMiddlewareProxy();
      proxy.setupFilesOnDisk({ filePaths: [] });
      const sourceFile = ts.createSourceFile(
        '/repo/fixture/entry.test.ts',
        ["import './missing.proxy';", ''].join('\n'),
        ts.ScriptTarget.Latest,
        true,
      );

      const result = proxyMockCallsCollectMiddleware({ sourceFile, program: undefined });

      expect(result).toStrictEqual([]);
    });
  });

  describe('two proxies mocking one module', () => {
    it('VALID: {two proxies each registerMock one export of path} => returns one record naming both exports', () => {
      const proxy = proxyMockCallsCollectMiddlewareProxy();
      const joinProxyPath = '/repo/fixture/join-like.proxy.ts';
      const dirnameProxyPath = '/repo/fixture/dirname-like.proxy.ts';
      proxy.setupFileContains({
        filePath: joinProxyPath,
        content: [
          "import { join } from 'path';",
          "import { registerMock } from '@dungeonmaster/testing/register-mock';",
          '',
          'export const joinLikeProxy = () => {',
          '  registerMock({ fn: join });',
          '};',
          '',
        ].join('\n'),
      });
      proxy.setupFileContains({
        filePath: dirnameProxyPath,
        content: [
          "import { dirname } from 'path';",
          "import { registerMock } from '@dungeonmaster/testing/register-mock';",
          '',
          'export const dirnameLikeProxy = () => {',
          '  registerMock({ fn: dirname });',
          '};',
          '',
        ].join('\n'),
      });
      proxy.setupFilesOnDisk({ filePaths: [joinProxyPath, dirnameProxyPath] });
      const sourceFile = ts.createSourceFile(
        '/repo/fixture/entry.test.ts',
        [
          "import { joinLikeProxy } from './join-like.proxy';",
          "import { dirnameLikeProxy } from './dirname-like.proxy';",
          '',
        ].join('\n'),
        ts.ScriptTarget.Latest,
        true,
      );

      const result = proxyMockCallsCollectMiddleware({ sourceFile, program: undefined });

      expect(result).toStrictEqual([
        {
          moduleName: 'path',
          factory: null,
          sourceFile: dirnameProxyPath,
          identifierNames: ['dirname', 'join'],
          objectIdentifierNames: [],
        },
      ]);
    });
  });

  describe('a proxy mocking a relative module', () => {
    it('VALID: {proxy registerMocks an export of a sibling file} => returns the sibling as an absolute path', () => {
      const proxy = proxyMockCallsCollectMiddlewareProxy();
      const proxyPath = '/repo/fixture/adapter/read-adapter.proxy.ts';
      proxy.setupFileContains({
        filePath: proxyPath,
        content: [
          "import { readAdapter } from './read-adapter';",
          "import { registerMock } from '@dungeonmaster/testing/register-mock';",
          '',
          'export const readAdapterProxy = () => {',
          '  registerMock({ fn: readAdapter });',
          '};',
          '',
        ].join('\n'),
      });
      proxy.setupFilesOnDisk({ filePaths: [proxyPath] });
      const sourceFile = ts.createSourceFile(
        '/repo/fixture/entry.test.ts',
        ["import { readAdapterProxy } from './adapter/read-adapter.proxy';", ''].join('\n'),
        ts.ScriptTarget.Latest,
        true,
      );

      const result = proxyMockCallsCollectMiddleware({ sourceFile, program: undefined });

      expect(result).toStrictEqual([
        {
          moduleName: '/repo/fixture/adapter/read-adapter',
          factory: null,
          sourceFile: proxyPath,
          identifierNames: ['readAdapter'],
          objectIdentifierNames: [],
        },
      ]);
    });
  });
});
