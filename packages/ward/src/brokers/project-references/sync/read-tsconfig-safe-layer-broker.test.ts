import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { readTsconfigSafeLayerBroker } from './read-tsconfig-safe-layer-broker';
import { readTsconfigSafeLayerBrokerProxy } from './read-tsconfig-safe-layer-broker.proxy';

describe('readTsconfigSafeLayerBroker()', () => {
  describe('valid tsconfig', () => {
    it('VALID: {valid tsconfig.json} => returns parsed TsconfigJsonWritable', () => {
      const proxy = readTsconfigSafeLayerBrokerProxy();
      proxy.returns({ content: '{"compilerOptions":{"composite":true},"references":[]}' });

      const result = readTsconfigSafeLayerBroker({
        tsconfigPath: FilePathStub({ value: '/repo/packages/shared/tsconfig.json' }),
      });

      expect(result).toStrictEqual({
        compilerOptions: { composite: true },
        references: [],
      });
    });

    it('VALID: {empty tsconfig.json} => returns empty object', () => {
      const proxy = readTsconfigSafeLayerBrokerProxy();
      proxy.returns({ content: '{}' });

      const result = readTsconfigSafeLayerBroker({
        tsconfigPath: FilePathStub({ value: '/repo/tsconfig.json' }),
      });

      expect(result).toStrictEqual({});
    });
  });

  describe('error handling', () => {
    it('ERROR: {file not found} => returns undefined', () => {
      const proxy = readTsconfigSafeLayerBrokerProxy();
      proxy.throws({ error: new Error('ENOENT: no such file') });

      const result = readTsconfigSafeLayerBroker({
        tsconfigPath: FilePathStub({ value: '/repo/packages/missing/tsconfig.json' }),
      });

      expect(result).toBe(undefined);
    });
  });
});
