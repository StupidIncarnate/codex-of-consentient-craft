import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';
import { RegistryUnreadableError } from '../../../errors/registry-unreadable/registry-unreadable-error';

import { registryReadBroker } from './registry-read-broker';
import { registryReadBrokerProxy } from './registry-read-broker.proxy';

describe('registryReadBroker', () => {
  describe('missing registry', () => {
    it('EMPTY: {no registry.json} => returns {instances: []}', async () => {
      const proxy = registryReadBrokerProxy();
      proxy.setupMissingRegistry();

      const result = await registryReadBroker();

      expect(result).toStrictEqual({ instances: [] });
    });
  });

  describe('unparseable registry', () => {
    it('ERROR: {malformed json} => throws RegistryUnreadableError', async () => {
      const proxy = registryReadBrokerProxy();
      proxy.setupPresentRegistry({ content: 'not-valid-json{{{' });

      await expect(registryReadBroker()).rejects.toThrow(RegistryUnreadableError);
    });

    it('ERROR: {valid json, wrong shape} => throws RegistryUnreadableError', async () => {
      const proxy = registryReadBrokerProxy();
      proxy.setupPresentRegistry({ content: JSON.stringify({ notInstances: [] }) });

      await expect(registryReadBroker()).rejects.toThrow(RegistryUnreadableError);
    });
  });

  describe('unreadable registry', () => {
    it('ERROR: {read fails} => throws RegistryUnreadableError naming the path', async () => {
      const proxy = registryReadBrokerProxy();
      proxy.setupReadFailure({ error: new Error('boom') });

      const error = await registryReadBroker().catch((caught: unknown) => caught);

      expect({ name: (error as Error).name, message: (error as Error).message }).toStrictEqual({
        name: 'RegistryUnreadableError',
        message:
          'Registry at /home/user/.dungeonmaster/siegelense/registry.json exists and could not be parsed: Error: Failed to read file at /home/user/.dungeonmaster/siegelense/registry.json',
      });
    });
  });

  describe('valid registry', () => {
    it('VALID: {two rows} => returns both, parsed', async () => {
      const proxy = registryReadBrokerProxy();
      const first = RegistryEntryStub({ id: InstanceIdStub({ value: 'inst_11111111' }) });
      const second = RegistryEntryStub({ id: InstanceIdStub({ value: 'inst_22222222' }) });
      const registry = RegistryStub({ instances: [first, second] });
      proxy.setupPresentRegistry({ content: JSON.stringify(registry) });

      const result = await registryReadBroker();

      expect(result).toStrictEqual(registry);
    });
  });
});
