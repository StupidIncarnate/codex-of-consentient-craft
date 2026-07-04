import { locationsDispatchStateTmpPathFindBroker } from './locations-dispatch-state-tmp-path-find-broker';
import { locationsDispatchStateTmpPathFindBrokerProxy } from './locations-dispatch-state-tmp-path-find-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('locationsDispatchStateTmpPathFindBroker', () => {
  describe('dispatch-state tmp path resolution', () => {
    it('VALID: {homeDir: "/home/user"} => returns /home/user/.dungeonmaster/dispatch-state.json.tmp', () => {
      const proxy = locationsDispatchStateTmpPathFindBrokerProxy();

      proxy.setupDispatchStateTmpPath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        dispatchStateTmpPath: FilePathStub({
          value: '/home/user/.dungeonmaster/dispatch-state.json.tmp',
        }),
      });

      const result = locationsDispatchStateTmpPathFindBroker();

      expect(result).toBe(
        AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/dispatch-state.json.tmp' }),
      );
    });
  });
});
