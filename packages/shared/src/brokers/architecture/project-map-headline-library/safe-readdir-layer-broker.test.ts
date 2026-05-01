import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('safeReaddirLayerBroker', () => {
  describe('successful read', () => {
    it('VALID: existing directory => returns entries', () => {
      const proxy = safeReaddirLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/project/src' });

      proxy.setupDirectory({ entries: [] });

      const result = safeReaddirLayerBroker({ dirPath });

      expect(result).toStrictEqual([]);
    });
  });

  describe('error handling', () => {
    it('ERROR: nonexistent directory => returns empty array', () => {
      const proxy = safeReaddirLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/nonexistent' });

      proxy.setupError({ error: new Error('ENOENT') });

      const result = safeReaddirLayerBroker({ dirPath });

      expect(result).toStrictEqual([]);
    });
  });
});
