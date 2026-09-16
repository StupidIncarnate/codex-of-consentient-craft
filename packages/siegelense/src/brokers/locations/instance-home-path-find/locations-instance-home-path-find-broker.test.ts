import { locationsInstanceHomePathFindBroker } from './locations-instance-home-path-find-broker';
import { locationsInstanceHomePathFindBrokerProxy } from './locations-instance-home-path-find-broker.proxy';
import { FilePathStub, AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';

describe('locationsInstanceHomePathFindBroker', () => {
  describe('home path resolution', () => {
    it('VALID: {tmpDir: "/tmp", instanceId: inst_7f3a9c21} => returns /tmp/dm-siege-inst_7f3a9c21', () => {
      const proxy = locationsInstanceHomePathFindBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });

      proxy.setupHomePath({
        tmpDir: '/tmp',
        homePath: FilePathStub({ value: '/tmp/dm-siege-inst_7f3a9c21' }),
      });

      const result = locationsInstanceHomePathFindBroker({ instanceId });

      expect(result).toBe(AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_7f3a9c21' }));
    });

    it('VALID: {different instanceId} => the home path changes with it', () => {
      const proxy = locationsInstanceHomePathFindBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_00000000' });

      proxy.setupHomePath({
        tmpDir: '/tmp',
        homePath: FilePathStub({ value: '/tmp/dm-siege-inst_00000000' }),
      });

      const result = locationsInstanceHomePathFindBroker({ instanceId });

      expect(result).toBe(AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_00000000' }));
    });
  });
});
