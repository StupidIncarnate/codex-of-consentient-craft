import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

import { StartSiegelenseDriver } from './start-siegelense-driver';

describe('StartSiegelenseDriver', () => {
  const testbed = installTestbedCreateBroker({
    baseName: BaseNameStub({ value: 'start-siegelense-driver' }),
  });
  const originalHome = process.env.DUNGEONMASTER_HOME;
  process.env.DUNGEONMASTER_HOME = testbed.guildPath;

  describe('a malformed raw instance id', () => {
    it('INVALID: {instanceId: "not-an-instance-id"} => rejects at the parsing boundary', async () => {
      await expect(StartSiegelenseDriver({ instanceId: 'not-an-instance-id' })).rejects.toThrow(
        /.+/u,
      );
    });
  });

  describe('a well-formed id with no reservation', () => {
    it('ERROR: {a fresh, isolated registry} => parses the id and delegates to DriverFlow, which rejects naming it', async () => {
      await expect(StartSiegelenseDriver({ instanceId: 'inst_00000000' })).rejects.toThrow(
        /inst_00000000 not found in the registry/u,
      );
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
