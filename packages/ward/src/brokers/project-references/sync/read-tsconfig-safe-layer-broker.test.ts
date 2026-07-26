import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { readTsconfigSafeLayerBroker } from './read-tsconfig-safe-layer-broker';
import { readTsconfigSafeLayerBrokerProxy } from './read-tsconfig-safe-layer-broker.proxy';

describe('readTsconfigSafeLayerBroker()', () => {
  describe('valid tsconfig', () => {
    it('VALID: {valid tsconfig.json} => returns parsed TsconfigJsonWritable', () => {
      const proxy = readTsconfigSafeLayerBrokerProxy();
      const tsconfigPath = FilePathStub({ value: '/repo/packages/shared/tsconfig.json' });
      proxy.returns({
        tsconfigPath,
        content: '{"compilerOptions":{"composite":true},"references":[]}',
      });

      const result = readTsconfigSafeLayerBroker({ tsconfigPath });

      expect(result).toStrictEqual({
        compilerOptions: { composite: true },
        references: [],
      });
    });

    it('VALID: {empty tsconfig.json} => returns empty object', () => {
      const proxy = readTsconfigSafeLayerBrokerProxy();
      const tsconfigPath = FilePathStub({ value: '/repo/tsconfig.json' });
      proxy.returns({ tsconfigPath, content: '{}' });

      const result = readTsconfigSafeLayerBroker({ tsconfigPath });

      expect(result).toStrictEqual({});
    });
  });

  describe('error handling', () => {
    it('ERROR: {file not found} => returns undefined', () => {
      const proxy = readTsconfigSafeLayerBrokerProxy();
      const tsconfigPath = FilePathStub({ value: '/repo/packages/missing/tsconfig.json' });
      proxy.throws({ tsconfigPath, error: new Error('ENOENT: no such file') });

      const result = readTsconfigSafeLayerBroker({ tsconfigPath });

      expect(result).toBe(undefined);
    });
  });
});
