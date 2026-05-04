import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

const DIR = AbsoluteFilePathStub({ value: '/repo/packages' });

describe('safeReaddirLayerBroker', () => {
  describe('directory exists', () => {
    it('VALID: {existing directory} => returns entries from adapter', () => {
      const proxy = safeReaddirLayerBrokerProxy();
      proxy.setupDirectory({ entries: [] });

      const result = safeReaddirLayerBroker({ dirPath: DIR });

      expect(result).toStrictEqual([]);
    });
  });

  describe('directory missing', () => {
    it('ERROR: {readdir throws} => returns empty array', () => {
      const proxy = safeReaddirLayerBrokerProxy();
      proxy.setupError({ error: new Error('ENOENT') });

      const result = safeReaddirLayerBroker({ dirPath: DIR });

      expect(result).toStrictEqual([]);
    });
  });
});
