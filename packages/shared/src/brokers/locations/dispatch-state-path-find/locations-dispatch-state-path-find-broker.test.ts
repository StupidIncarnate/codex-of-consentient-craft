import { locationsDispatchStatePathFindBroker } from './locations-dispatch-state-path-find-broker';
import { locationsDispatchStatePathFindBrokerProxy } from './locations-dispatch-state-path-find-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('locationsDispatchStatePathFindBroker', () => {
  describe('dispatch-state path resolution', () => {
    it('VALID: {homeDir: "/home/user"} => returns /home/user/.dungeonmaster/dispatch-state.json', () => {
      const proxy = locationsDispatchStatePathFindBrokerProxy();

      proxy.setupDispatchStatePath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        dispatchStatePath: FilePathStub({
          value: '/home/user/.dungeonmaster/dispatch-state.json',
        }),
      });

      const result = locationsDispatchStatePathFindBroker();

      expect(result).toBe(
        AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/dispatch-state.json' }),
      );
    });
  });
});
