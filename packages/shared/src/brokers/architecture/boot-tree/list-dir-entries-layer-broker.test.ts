import { listDirEntriesLayerBroker } from './list-dir-entries-layer-broker';
import { listDirEntriesLayerBrokerProxy } from './list-dir-entries-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('listDirEntriesLayerBroker', () => {
  describe('successful reads', () => {
    it('VALID: {existing directory with files} => returns entries', () => {
      const proxy = listDirEntriesLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/project/src/startup' });
      const setupEntries = proxy.setupFiles({ names: ['start-app.ts'] });
      const result = listDirEntriesLayerBroker({ dirPath });

      expect(result).toStrictEqual(setupEntries);
    });

    it('VALID: {empty directory} => returns empty array', () => {
      const proxy = listDirEntriesLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/project/src/startup' });
      proxy.setupEmpty();
      const result = listDirEntriesLayerBroker({ dirPath });

      expect(result).toStrictEqual([]);
    });
  });

  describe('error handling', () => {
    it('ERROR: {missing directory} => returns empty array', () => {
      const proxy = listDirEntriesLayerBrokerProxy();
      const dirPath = AbsoluteFilePathStub({ value: '/project/src/nonexistent' });
      proxy.setupError({ error: new Error('ENOENT') });
      const result = listDirEntriesLayerBroker({ dirPath });

      expect(result).toStrictEqual([]);
    });
  });
});
