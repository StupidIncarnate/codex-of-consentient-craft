import { sourceFactsExtractBroker } from './source-facts-extract-broker';
import { sourceFactsExtractBrokerProxy } from './source-facts-extract-broker.proxy';

describe('sourceFactsExtractBroker', () => {
  describe('a caller', () => {
    it('VALID: {a caller importing an adapter} => the import and its names', () => {
      sourceFactsExtractBrokerProxy();

      const result = sourceFactsExtractBroker({
        file: 'packages/a/src/brokers/x/x-broker.ts',
        text: [
            "import { fsReadFileAdapter } from '../../adapters/fs/read-file/fs-read-file-adapter';",
            "import type { Thing } from '../../contracts/thing/thing-contract';",
            "import * as ts from '#gateway/npm/typescript';",
            'export const xBroker = async (): Promise<void> => { await fsReadFileAdapter(); };',
          ].join('\n'),
      });

      expect(result).toStrictEqual({
        imports: [
          {
            specifier: '../../adapters/fs/read-file/fs-read-file-adapter',
            names: ['fsReadFileAdapter'],
          },
          { specifier: '#gateway/npm/typescript', names: ['*'] },
        ],
        reExports: [],
        exportNames: ['xBroker'],
        catchAllSites: [],
      });
    });
  });

  describe('a barrel', () => {
    it('VALID: {star and named re-exports} => re-exports with the star flag and names', () => {
      sourceFactsExtractBrokerProxy();

      const result = sourceFactsExtractBroker({
        file: 'packages/a/adapters.ts',
        text: [
            "export * from './src/adapters/a/a-adapter';",
            "export { bAdapter } from './src/adapters/b/b-adapter';",
            "export type { CType } from './src/adapters/c/c-adapter';",
          ].join('\n'),
      });

      expect(result).toStrictEqual({
        imports: [],
        reExports: [
          { specifier: './src/adapters/a/a-adapter', names: [], isStar: true },
          { specifier: './src/adapters/b/b-adapter', names: ['bAdapter'], isStar: false },
        ],
        exportNames: [],
        catchAllSites: [],
      });
    });
  });

  describe('a proxy', () => {
    it('VALID: {catch-all staging in a proxy} => each site with its line and kind', () => {
      sourceFactsExtractBrokerProxy();

      const result = sourceFactsExtractBroker({
        file: 'packages/a/src/adapters/x/x-adapter.proxy.ts',
        text: [
            "import { registerMock } from '@acme/testing/register-mock';",
            'export const xAdapterProxy = () => {',
            '  const handle = registerMock({ fn: run });',
            '  handle.calledWith([]).returns(1);',
            "  handle.calledWith(['/a']).returns(2);",
            '  handle.onceFor([() => true]).returns(3);',
            '  return handle.callsMatching([]);',
            '};',
          ].join('\n'),
      });

      expect(result.catchAllSites).toStrictEqual([
        { line: 4, kind: 'empty-address', snippet: 'handle.calledWith([])' },
        { line: 6, kind: 'accept-all-predicate', snippet: 'handle.onceFor([() => true])' },
        { line: 7, kind: 'read-all', snippet: 'handle.callsMatching([])' },
      ]);
    });
  });

  describe('a file with nothing to report', () => {
    it('EMPTY: {an empty file} => empty facts', () => {
      sourceFactsExtractBrokerProxy();

      const result = sourceFactsExtractBroker({
        file: 'packages/a/src/empty.ts',
        text: '',
      });

      expect(result).toStrictEqual({
        imports: [],
        reExports: [],
        exportNames: [],
        catchAllSites: [],
      });
    });
  });
});
