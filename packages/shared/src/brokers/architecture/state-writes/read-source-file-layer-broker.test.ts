import { readSourceFileLayerBroker } from './read-source-file-layer-broker';
import { readSourceFileLayerBrokerProxy } from './read-source-file-layer-broker.proxy';

describe('readSourceFileLayerBroker', () => {
  describe('file exists', () => {
    it('VALID: {file present} => returns file contents', () => {
      const proxy = readSourceFileLayerBrokerProxy();
      const filePath = '/repo/packages/server/src/broker.ts';
      const content = 'export const foo = () => {};';

      proxy.setupReturns({ filePath, content });

      const result = readSourceFileLayerBroker({ filePath });

      expect(result).toBe('export const foo = () => {};');
    });
  });

  describe('file missing', () => {
    it('ERROR: {file missing} => returns undefined', () => {
      const proxy = readSourceFileLayerBrokerProxy();
      const filePath = '/repo/packages/server/src/missing.ts';

      proxy.setupMissing({ filePath });

      const result = readSourceFileLayerBroker({ filePath });

      expect(result).toBe(undefined);
    });
  });
});
