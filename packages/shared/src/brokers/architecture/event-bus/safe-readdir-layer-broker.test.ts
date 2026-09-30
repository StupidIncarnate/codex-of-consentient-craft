import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

const DIR = '/repo/packages';

describe('safeReaddirLayerBroker', () => {
  describe('directory exists', () => {
    it('VALID: {existing directory} => returns entries from adapter', () => {
      const proxy = safeReaddirLayerBrokerProxy();
      proxy.setupDirectory({ dirPath: DIR, entries: [] });

      const result = safeReaddirLayerBroker({ dirPath: DIR });

      expect(result).toStrictEqual([]);
    });
  });

  describe('directory missing', () => {
    it('ERROR: {readdir throws} => returns empty array', () => {
      const proxy = safeReaddirLayerBrokerProxy();
      proxy.setupError({ dirPath: DIR, error: FileMissingErrorStub({ path: DIR }) });

      const result = safeReaddirLayerBroker({ dirPath: DIR });

      expect(result).toStrictEqual([]);
    });
  });
});
