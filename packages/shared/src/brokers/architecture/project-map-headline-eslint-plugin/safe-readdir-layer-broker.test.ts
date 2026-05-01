import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

const DIR_PATH = AbsoluteFilePathStub({ value: '/project/src/brokers/rule' });

describe('safeReaddirLayerBroker', () => {
  describe('directory exists', () => {
    it('VALID: {readable directory} => returns entries', () => {
      const proxy = safeReaddirLayerBrokerProxy();
      proxy.returns({ entries: [] });

      const result = safeReaddirLayerBroker({ dirPath: DIR_PATH });

      expect(result).toStrictEqual([]);
    });
  });

  describe('directory missing', () => {
    it('ERROR: {readdir throws ENOENT} => returns empty array', () => {
      const proxy = safeReaddirLayerBrokerProxy();
      proxy.throws({ error: new Error('ENOENT: no such file or directory') });

      const result = safeReaddirLayerBroker({ dirPath: DIR_PATH });

      expect(result).toStrictEqual([]);
    });
  });
});
