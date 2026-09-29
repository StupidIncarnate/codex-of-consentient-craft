import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { ProcessIdStub } from '@dungeonmaster/shared/contracts/process-id/process-id.stub';

import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import { ReadingCountStub } from '../../../contracts/reading-count/reading-count.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { SpecNameStub } from '../../../contracts/spec-name/spec-name.stub';
import { InstanceUnknownError } from '../../../errors/instance-unknown/instance-unknown-error';
import { LaneBootFailedError } from '../../../errors/lane-boot-failed/lane-boot-failed-error';

import { SiegelenseDriverResponder } from './siegelense-driver-responder';
import { SiegelenseDriverResponderProxy } from './siegelense-driver-responder.proxy';

const SPEC_NAME = SpecNameStub({ value: 'api' });

describe('SiegelenseDriverResponder', () => {
  describe('a reserved instance boots cleanly', () => {
    it('VALID: {registry row exists} => hands the booted lane off to DriverServeLayerResponder', async () => {
      const proxy = SiegelenseDriverResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const entry = RegistryEntryStub({ id: instanceId, guildId, specName: SPEC_NAME });
      const lane = LaneSessionStub();
      proxy.stageRegistryRow({ entry });
      proxy.stageBootSucceeds({ lane, instanceId });

      await SiegelenseDriverResponder({ instanceId });

      expect(proxy.getServeCallArgs()).toStrictEqual({ instanceId, guildId, lane });
    });

    it('VALID: {registry row exists} => stamps the row with this pid, the booted pgids and its socket path', async () => {
      const proxy = SiegelenseDriverResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const entry = RegistryEntryStub({ id: instanceId, specName: SPEC_NAME });
      const lane = LaneSessionStub();
      proxy.stageRegistryRow({ entry });
      proxy.stageBootSucceeds({ lane, instanceId });
      proxy.stagePid({ pid: 48213 });

      await SiegelenseDriverResponder({ instanceId });
      const mutated = proxy.applyRegistryMutate({ current: { instances: [entry] } });
      const stampedRow = mutated.instances.find((row) => row.id === instanceId);

      expect({
        pid: stampedRow?.pid,
        pgids: stampedRow?.pgids,
        socketPath: stampedRow?.socketPath,
      }).toStrictEqual({
        pid: '48213',
        pgids: lane.pgids,
        socketPath: proxy.getExpectedSocketPath({ instanceId }),
      });
    });
  });

  describe('laneBootBroker throws instead of booting', () => {
    it('ERROR: {laneBootBroker rejects} => releases boot.lock, never stamps the registry, and rethrows the same error', async () => {
      const proxy = SiegelenseDriverResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_bad60071' });
      const entry = RegistryEntryStub({ id: instanceId, specName: SPEC_NAME });
      const bootError = new LaneBootFailedError({
        specName: entry.specName,
        instanceId,
        unready: ['api'],
        logPaths: [
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_bad60071/api.log',
        ],
      });
      proxy.stageRegistryRow({ entry });
      proxy.stageBootFails({ error: bootError, instanceId });

      await expect(SiegelenseDriverResponder({ instanceId })).rejects.toThrow(bootError);

      expect(proxy.getBootLockReleaseCallArgs()).toStrictEqual({ instanceId });
      expect(proxy.getRegistryUpdateCallCount()).toStrictEqual(ReadingCountStub({ value: 0 }));
      expect(proxy.getServeCallArgs()).toBe(undefined);
    });

    it('ERROR: {laneBootBroker rejects} => writes the boot-failure marker carrying that same error message', async () => {
      const proxy = SiegelenseDriverResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_bad60071' });
      const entry = RegistryEntryStub({ id: instanceId, specName: SPEC_NAME });
      const bootError = new LaneBootFailedError({
        specName: entry.specName,
        instanceId,
        unready: ['api'],
        logPaths: [
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_bad60071/api.log',
        ],
      });
      proxy.stageRegistryRow({ entry });
      proxy.stageBootFails({ error: bootError, instanceId });

      await expect(SiegelenseDriverResponder({ instanceId })).rejects.toThrow(bootError);

      expect(proxy.getBootFailureMarkerWriteCallArgs()).toStrictEqual({
        evidencePath: proxy.getExpectedEvidencePath({ instanceId }),
        message: bootError.message,
      });
    });

    it('ERROR: {laneBootBroker rejects, and writing the marker also throws} => still rethrows the original boot error', async () => {
      const proxy = SiegelenseDriverResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_bad60071' });
      const entry = RegistryEntryStub({ id: instanceId, specName: SPEC_NAME });
      const bootError = new LaneBootFailedError({
        specName: entry.specName,
        instanceId,
        unready: ['api'],
        logPaths: [
          '/repo/.dungeonmaster-assets/siegelense-assets/guilds/g1/instances/inst_bad60071/api.log',
        ],
      });
      proxy.stageRegistryRow({ entry });
      proxy.stageBootFailsAndMarkerWriteFails({
        error: bootError,
        instanceId,
        markerWriteError: Object.assign(new Error('ENOSPC: no space left on device'), {
          code: 'ENOSPC',
        }),
      });

      await expect(SiegelenseDriverResponder({ instanceId })).rejects.toThrow(bootError);

      expect(proxy.getStderrText()).toBe(
        'SiegelenseDriverResponder: writing the boot-failure marker for inst_bad60071 failed: Error: ENOSPC: no space left on device\n',
      );
    });
  });

  describe('the registry has no row for this instance', () => {
    it('ERROR: {instance not reserved} => rejects with InstanceUnknownError, the same shared message every other call throws', async () => {
      const proxy = SiegelenseDriverResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_dead0000' });
      proxy.stageEmptyRegistry();

      await expect(SiegelenseDriverResponder({ instanceId })).rejects.toStrictEqual(
        new InstanceUnknownError({ instanceId }),
      );
    });
  });

  describe('the registry row already has a live driver', () => {
    it('ERROR: {row has a live driver} => throws naming the pid and never boots a lane', async () => {
      const proxy = SiegelenseDriverResponderProxy();
      const instanceId = InstanceIdStub({ value: 'inst_11fe0001' });
      const livePid = ProcessIdStub({ value: '108019' });
      const entry = RegistryEntryStub({ id: instanceId, specName: SPEC_NAME, pid: livePid });
      proxy.stageRegistryRow({ entry });
      proxy.stageDriverAlreadyLive({ entry });

      await expect(SiegelenseDriverResponder({ instanceId })).rejects.toThrow(
        `Instance ${instanceId} already has a running driver (pid ${livePid}); driver is started by start and is not typed by hand.`,
      );

      expect(proxy.getServeCallArgs()).toBe(undefined);
      expect(proxy.getRegistryUpdateCallCount()).toStrictEqual(ReadingCountStub({ value: 0 }));
    });
  });
});
