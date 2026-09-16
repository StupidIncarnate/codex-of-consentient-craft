import { AbsoluteFilePathStub, ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { instanceReleaseBroker } from './instance-release-broker';
import { instanceReleaseBrokerProxy } from './instance-release-broker.proxy';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';

describe('instanceReleaseBroker', () => {
  describe('a live instance is released', () => {
    it('VALID: {instanceId} => returns the row killed with pid and pgids cleared', async () => {
      const proxy = instanceReleaseBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const entry = RegistryEntryStub({
        id: instanceId,
        pid: ProcessIdStub(),
        pgids: [ProcessGroupIdStub()],
        socketPath: AbsoluteFilePathStub({ value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock' }),
        state: 'alive',
      });
      const registry = RegistryStub({ instances: [entry] });
      proxy.setupCurrentRegistry({ json: JSON.stringify(registry) });

      const result = await instanceReleaseBroker({ instanceId });

      expect(result).toStrictEqual(
        RegistryEntryStub({ ...entry, state: 'killed', pid: null, pgids: [], socketPath: null }),
      );
    });
  });

  describe('the tombstone survives', () => {
    it('VALID: {instanceId} => the row is still in the written registry, by count and by id', async () => {
      const proxy = instanceReleaseBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const bystanderId = InstanceIdStub({ value: 'inst_deadbeef' });
      const released = RegistryEntryStub({
        id: instanceId,
        pid: ProcessIdStub(),
        pgids: [ProcessGroupIdStub()],
        socketPath: AbsoluteFilePathStub({ value: '/tmp/dm-siege-sockets/inst_7f3a9c21.sock' }),
      });
      const bystander = RegistryEntryStub({ id: bystanderId });
      const registry = RegistryStub({ instances: [bystander, released] });
      proxy.setupCurrentRegistry({ json: JSON.stringify(registry) });

      await instanceReleaseBroker({ instanceId });

      const expectedRegistry = RegistryStub({
        instances: [
          bystander,
          RegistryEntryStub({
            ...released,
            state: 'killed',
            pid: null,
            pgids: [],
            socketPath: null,
          }),
        ],
      });

      expect(proxy.getWrittenRegistry()).toStrictEqual(expectedRegistry);
    });
  });
});
