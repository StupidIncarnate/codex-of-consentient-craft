import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';
import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';

import { registryUpdateBroker } from './registry-update-broker';
import { registryUpdateBrokerProxy } from './registry-update-broker.proxy';

describe('registryUpdateBroker', () => {
  describe('read-mutate-write cycle', () => {
    it('VALID: {mutate adds a second row} => the write holds both rows', async () => {
      const proxy = registryUpdateBrokerProxy();
      const first = RegistryEntryStub({ id: InstanceIdStub({ value: 'inst_11111111' }) });
      const second = RegistryEntryStub({ id: InstanceIdStub({ value: 'inst_22222222' }) });
      const current = RegistryStub({ instances: [first] });
      proxy.setupCurrentRegistry({ json: JSON.stringify(current) });

      const result = await registryUpdateBroker({
        mutate: (registry) => ({ instances: [...registry.instances, second] }),
      });

      const expected = RegistryStub({ instances: [first, second] });

      expect(result).toStrictEqual(expected);
      expect(proxy.getWrittenContent()).toBe(`${JSON.stringify(expected)}\n`);
    });
  });

  describe('registry lock', () => {
    it('VALID: {no lock present} => acquires the lock, writes, and releases it', async () => {
      const proxy = registryUpdateBrokerProxy();
      const current = RegistryStub();
      proxy.setupCurrentRegistry({ json: JSON.stringify(current) });

      await registryUpdateBroker({ mutate: (registry) => registry });

      expect(proxy.getLockWriteFlag()).toBe('wx');
      expect(proxy.getLockDeletedPaths()).toStrictEqual([proxy.lockPath]);
    });

    it('ERROR: {mutate throws} => the lock is released', async () => {
      const proxy = registryUpdateBrokerProxy();
      const current = RegistryStub();
      proxy.setupCurrentRegistryForThrowingMutate({ json: JSON.stringify(current) });
      const thrown = new Error('mutate boom');

      await expect(
        registryUpdateBroker({
          mutate: () => {
            throw thrown;
          },
        }),
      ).rejects.toThrow(thrown.message);

      expect(proxy.getLockDeletedPaths()).toStrictEqual([proxy.lockPath]);
    });

    it('EDGE: {a stale lock} => takes it over', async () => {
      const proxy = registryUpdateBrokerProxy();
      const nowMs = EpochMsStub();
      const current = RegistryStub();
      proxy.setupCurrentRegistryWithStaleLock({ json: JSON.stringify(current), nowMs });

      const result = await registryUpdateBroker({ mutate: (registry) => registry });

      expect(result).toStrictEqual(current);
    });

    it('ERROR: {a fresh lock held by another process} => throws rather than writing', async () => {
      const proxy = registryUpdateBrokerProxy();
      proxy.setupLockHeldFreshByAnotherProcess();

      await expect(registryUpdateBroker({ mutate: (registry) => registry })).rejects.toThrow(
        /Registry lock held by another process/u,
      );

      expect(proxy.getWrittenContent()).toBe(undefined);
    });
  });
});
