import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

const DIR_PATH = AbsoluteFilePathStub({ value: '/repo/packages/shared/src/guards' });

describe('safeReaddirLayerBroker', () => {
  describe('directory exists', () => {
    it('VALID: {existing directory} => returns entries from adapter', () => {
      const proxy = safeReaddirLayerBrokerProxy();
      const entries = proxy.setupDirectory({ entries: [] });

      const result = safeReaddirLayerBroker({ dirPath: DIR_PATH });

      expect(result).toStrictEqual(entries);
    });
  });

  describe('directory does not exist', () => {
    it('ERROR: {missing directory} => returns empty array', () => {
      const proxy = safeReaddirLayerBrokerProxy();
      proxy.setupError({ error: new Error('ENOENT: no such file or directory') });

      const result = safeReaddirLayerBroker({ dirPath: DIR_PATH });

      expect(result).toStrictEqual([]);
    });
  });
});
