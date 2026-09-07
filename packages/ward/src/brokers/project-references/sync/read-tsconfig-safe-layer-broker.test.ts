import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { readTsconfigSafeLayerBroker } from './read-tsconfig-safe-layer-broker';
import { readTsconfigSafeLayerBrokerProxy } from './read-tsconfig-safe-layer-broker.proxy';

describe('readTsconfigSafeLayerBroker()', () => {
  describe('valid tsconfig', () => {
    it('VALID: {valid tsconfig.json} => returns parsed status with TsconfigJsonWritable data', () => {
      const proxy = readTsconfigSafeLayerBrokerProxy();
      const tsconfigPath = FilePathStub({ value: '/repo/packages/shared/tsconfig.json' });
      proxy.returns({
        tsconfigPath,
        content: '{"compilerOptions":{"composite":true},"references":[]}',
      });

      const result = readTsconfigSafeLayerBroker({ tsconfigPath });

      expect(result).toStrictEqual({
        status: 'parsed',
        data: { compilerOptions: { composite: true }, references: [] },
      });
    });

    it('VALID: {empty tsconfig.json} => returns parsed status with empty data object', () => {
      const proxy = readTsconfigSafeLayerBrokerProxy();
      const tsconfigPath = FilePathStub({ value: '/repo/tsconfig.json' });
      proxy.returns({ tsconfigPath, content: '{}' });

      const result = readTsconfigSafeLayerBroker({ tsconfigPath });

      expect(result).toStrictEqual({ status: 'parsed', data: {} });
    });
  });

  describe('error handling', () => {
    it('ERROR: {JSONC with comments throws SyntaxError} => returns unparseable status', () => {
      const proxy = readTsconfigSafeLayerBrokerProxy();
      const tsconfigPath = FilePathStub({ value: '/repo/packages/init/tsconfig.json' });
      proxy.throws({
        tsconfigPath,
        error: new SyntaxError('Unexpected token / in JSON at position 0'),
      });

      const result = readTsconfigSafeLayerBroker({ tsconfigPath });

      expect(result).toStrictEqual({ status: 'unparseable' });
    });

    it('ERROR: {file not found} => returns missing status', () => {
      const proxy = readTsconfigSafeLayerBrokerProxy();
      const tsconfigPath = FilePathStub({ value: '/repo/packages/missing/tsconfig.json' });
      proxy.throws({ tsconfigPath, error: new Error('ENOENT: no such file') });

      const result = readTsconfigSafeLayerBroker({ tsconfigPath });

      expect(result).toStrictEqual({ status: 'missing' });
    });
  });
});
