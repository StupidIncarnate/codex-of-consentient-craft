import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

import { InstanceIdStub } from '../../contracts/instance-id/instance-id.stub';

import { DriverFlow } from './driver-flow';

describe('DriverFlow', () => {
  const testbed = installTestbedCreateBroker({ baseName: BaseNameStub({ value: 'driver-flow' }) });
  const originalHome = process.env.DUNGEONMASTER_HOME;
  process.env.DUNGEONMASTER_HOME = testbed.guildPath;

  describe('the registry has no row for this instance', () => {
    it('ERROR: {a fresh, isolated registry} => rejects naming the instance', async () => {
      const instanceId = InstanceIdStub({ value: 'inst_00000000' });

      await expect(DriverFlow({ instanceId })).rejects.toThrow(/not found in the registry/u);
    });
  });

  afterAll(() => {
    if (originalHome === undefined) {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
    } else {
      process.env.DUNGEONMASTER_HOME = originalHome;
    }
    testbed.cleanup();
  });
});
