import { GuildIdStub } from '@dungeonmaster/shared/contracts';

import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { LaneBootFailedError } from '../../../errors/lane-boot-failed/lane-boot-failed-error';

import { SiegelenseDriverResponder } from './siegelense-driver-responder';
import { SiegelenseDriverResponderProxy } from './siegelense-driver-responder.proxy';

describe('SiegelenseDriverResponder', () => {
  describe('a reserved instance boots cleanly', () => {
    it('VALID: {registry row exists} => hands the booted lane off to DriverServeLayerResponder', async () => {
      const proxy = SiegelenseDriverResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const entry = RegistryEntryStub({ id: instanceId, guildId });
      const lane = LaneSessionStub();
      proxy.stageRegistryRow({ entry });
      proxy.stageBootSucceeds({ lane });

      await SiegelenseDriverResponder({ instanceId });

      expect(proxy.getServeCallArgs()).toStrictEqual({ instanceId, guildId, lane });
    });

    it('VALID: {registry row exists} => stamps the row with this pid, the booted pgids and its socket path', async () => {
      const proxy = SiegelenseDriverResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const entry = RegistryEntryStub({ id: instanceId });
      const lane = LaneSessionStub();
      proxy.stageRegistryRow({ entry });
      proxy.stageBootSucceeds({ lane });

      await SiegelenseDriverResponder({ instanceId });
      const mutated = proxy.applyRegistryMutate({ current: { instances: [entry] } });
      const stampedRow = mutated.instances.find((row) => row.id === instanceId);

      expect({
        pid: stampedRow?.pid,
        pgids: stampedRow?.pgids,
        socketPath: stampedRow?.socketPath,
      }).toStrictEqual({
        pid: String(process.pid),
        pgids: lane.pgids,
        socketPath: proxy.getExpectedSocketPath(),
      });
    });
  });

  describe('laneBootBroker throws instead of booting', () => {
    it('ERROR: {laneBootBroker rejects} => releases boot.lock, never stamps the registry, and rethrows the same error', async () => {
      const proxy = SiegelenseDriverResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_bad60071' });
      const entry = RegistryEntryStub({ id: instanceId });
      const bootError = new LaneBootFailedError({
        specName: entry.specName,
        instanceId,
        unready: ['api'],
        logPaths: ['/repo/.siegelense/guilds/g1/instances/inst_bad60071/api.log'],
      });
      proxy.stageRegistryRow({ entry });
      proxy.stageBootFails({ error: bootError });

      await expect(SiegelenseDriverResponder({ instanceId })).rejects.toThrow(bootError);

      expect(proxy.getBootLockReleaseCallArgs()).toStrictEqual({ instanceId });
      expect(proxy.getRegistryUpdateCallCount()).toStrictEqual(ReadingCountStub({ value: 0 }));
      expect(proxy.getServeCallArgs()).toBe(undefined);
    });
  });

  describe('the registry has no row for this instance', () => {
    it('ERROR: {instance not reserved} => throws naming the instance', async () => {
      const proxy = SiegelenseDriverResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_dead0000' });
      proxy.stageEmptyRegistry();

      await expect(SiegelenseDriverResponder({ instanceId })).rejects.toThrow(
        /inst_dead0000 not found in the registry/u,
      );
    });
  });
});
