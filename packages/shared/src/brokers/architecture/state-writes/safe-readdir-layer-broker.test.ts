import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

describe('safeReaddirLayerBroker', () => {
  describe('directory exists', () => {
    it('VALID: {directory with entries} => returns entries', () => {
      const proxy = safeReaddirLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/repo/packages/server/src' });

      proxy.setupDirectory({ dirPath, entries: [] });

      const result = safeReaddirLayerBroker({ dirPath });

      expect(result).toStrictEqual([]);
    });
  });

  describe('directory missing', () => {
    it('ERROR: {readdir throws} => returns empty array', () => {
      const proxy = safeReaddirLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/repo/packages/nonexistent/src' });

      proxy.setupError({ dirPath, error: FileMissingErrorStub({ path: dirPath }) });

      const result = safeReaddirLayerBroker({ dirPath });

      expect(result).toStrictEqual([]);
    });
  });
});
