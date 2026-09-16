import { RegistryStub } from '../../../contracts/registry/registry.stub';

import { registryWriteBroker } from './registry-write-broker';
import { registryWriteBrokerProxy } from './registry-write-broker.proxy';

describe('registryWriteBroker', () => {
  describe('successful write', () => {
    it('VALID: {write} => writes the .tmp path then renames it', async () => {
      const proxy = registryWriteBrokerProxy();
      proxy.setupWriteSuccess();
      const registry = RegistryStub();

      await registryWriteBroker({ registry });

      expect(proxy.getWrittenPath()).toBe('/home/user/.dungeonmaster/siegelense/registry.json.tmp');
      expect(proxy.getWrittenContent()).toBe(`${JSON.stringify(registry)}\n`);
      expect(proxy.getRenamedFrom()).toBe('/home/user/.dungeonmaster/siegelense/registry.json.tmp');
      expect(proxy.getRenamedTo()).toBe('/home/user/.dungeonmaster/siegelense/registry.json');
    });
  });

  describe('write failure', () => {
    it('ERROR: {tmp write fails} => rejects with the write error', async () => {
      const proxy = registryWriteBrokerProxy();
      proxy.setupWriteFailure({ error: new Error('disk full') });

      await expect(registryWriteBroker({ registry: RegistryStub() })).rejects.toThrow(
        /^disk full$/u,
      );
    });
  });
});
