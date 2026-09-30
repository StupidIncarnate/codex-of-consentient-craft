import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { barrelWrapperPathsReadBroker } from './barrel-wrapper-paths-read-broker';
import { barrelWrapperPathsReadBrokerProxy } from './barrel-wrapper-paths-read-broker.proxy';

describe('barrelWrapperPathsReadBroker', () => {
  describe('readable barrel', () => {
    it('VALID: {barrel re-exports one name from a sibling and the rest through a module} => maps only the sibling name', () => {
      const proxy = barrelWrapperPathsReadBrokerProxy();
      proxy.returns({
        path: '/repo/packages/@gateway/node/src/fs__promises/fs__promises.ts',
        contents: [
          "export * from 'fs/promises';",
          "export { writeFile } from './write-file/write-file';",
        ].join('\n'),
      });

      const result = barrelWrapperPathsReadBroker({
        barrelPath: '/repo/packages/@gateway/node/src/fs__promises/fs__promises.ts',
      });

      expect(Array.from(result.entries())).toStrictEqual([['writeFile', 'write-file/write-file']]);
    });
  });

  describe('no barrel to read', () => {
    it('EMPTY: {barrelPath null} => returns an empty map', () => {
      barrelWrapperPathsReadBrokerProxy();

      const result = barrelWrapperPathsReadBroker({ barrelPath: null });

      expect(Array.from(result.entries())).toStrictEqual([]);
    });

    it('EMPTY: {barrel file missing} => returns an empty map', () => {
      const proxy = barrelWrapperPathsReadBrokerProxy();
      proxy.missing({ path: '/repo/packages/shared/src/brokers/brokers.ts' });

      const result = barrelWrapperPathsReadBroker({
        barrelPath: '/repo/packages/shared/src/brokers/brokers.ts',
      });

      expect(Array.from(result.entries())).toStrictEqual([]);
    });

    it('ERROR: {barrel read throws} => returns an empty map', () => {
      const proxy = barrelWrapperPathsReadBrokerProxy();
      proxy.throws({
        path: '/repo/packages/shared/src/brokers/brokers.ts',
        error: FsErrorStub({
          code: 'EACCES',
          path: '/repo/packages/shared/src/brokers/brokers.ts',
        }),
      });

      const result = barrelWrapperPathsReadBroker({
        barrelPath: '/repo/packages/shared/src/brokers/brokers.ts',
      });

      expect(Array.from(result.entries())).toStrictEqual([]);
    });
  });
});
