import { deleteEnv, getEnv, setEnv } from '#gateway/node/process';
import { installTestbedCreateBroker } from '@dungeonmaster/testing';

import { InstanceUnknownError } from '../errors/instance-unknown/instance-unknown-error';
import { StartSiegelenseDriver } from './start-siegelense-driver';

describe('StartSiegelenseDriver', () => {
  const testbed = installTestbedCreateBroker({
    baseName: 'start-siegelense-driver',
  });
  const originalHome = getEnv('DUNGEONMASTER_HOME');

  beforeAll(() => {
    setEnv('DUNGEONMASTER_HOME', testbed.guildPath);
  });

  describe('a malformed raw instance id', () => {
    it('INVALID: {instanceId: "not-an-instance-id"} => rejects at the parsing boundary', async () => {
      await expect(StartSiegelenseDriver({ instanceId: 'not-an-instance-id' })).rejects.toThrow(
        /.+/u,
      );
    });
  });

  describe('a well-formed id with no reservation', () => {
    it('ERROR: {a fresh, isolated registry} => parses the id and delegates to DriverFlow, which rejects with InstanceUnknownError', async () => {
      await expect(StartSiegelenseDriver({ instanceId: 'inst_00000000' })).rejects.toThrow(
        new InstanceUnknownError({ instanceId: 'inst_00000000' }),
      );
    });
  });

  afterAll(() => {
    if (originalHome === undefined) {
      deleteEnv('DUNGEONMASTER_HOME');
    } else {
      setEnv('DUNGEONMASTER_HOME', originalHome);
    }
    testbed.cleanup();
  });
});
