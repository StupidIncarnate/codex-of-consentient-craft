import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

describe('safeReaddirLayerBroker', () => {
  describe('successful read', () => {
    it('VALID: existing directory => returns entries', () => {
      const proxy = safeReaddirLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/repo/packages' });

      proxy.setupDirectory({ dirPath, entries: [] });

      const result = safeReaddirLayerBroker({ dirPath });

      expect(result).toStrictEqual([]);
    });
  });

  describe('error handling', () => {
    it('ERROR: nonexistent directory => returns empty array', () => {
      const proxy = safeReaddirLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/nonexistent' });

      proxy.setupError({ dirPath, error: FileMissingErrorStub({ path: dirPath }) });

      const result = safeReaddirLayerBroker({ dirPath });

      expect(result).toStrictEqual([]);
    });
  });
});
