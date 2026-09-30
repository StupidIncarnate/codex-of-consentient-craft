import { locationsDispatchStateTmpPathFindBroker } from './locations-dispatch-state-tmp-path-find-broker';
import { locationsDispatchStateTmpPathFindBrokerProxy } from './locations-dispatch-state-tmp-path-find-broker.proxy';

describe('locationsDispatchStateTmpPathFindBroker', () => {
  describe('dispatch-state tmp path resolution', () => {
    it('VALID: {homeDir: "/home/user"} => returns /home/user/.dungeonmaster/dispatch-state.json.tmp', () => {
      const proxy = locationsDispatchStateTmpPathFindBrokerProxy();

      proxy.setupDispatchStateTmpPath({
        homeDir: '/home/user',
        homePath: '/home/user/.dungeonmaster',
        dispatchStateTmpPath: '/home/user/.dungeonmaster/dispatch-state.json.tmp',
      });

      const result = locationsDispatchStateTmpPathFindBroker();

      expect(result).toBe('/home/user/.dungeonmaster/dispatch-state.json.tmp');
    });
  });
});
