import { FilePathStub, GuildIdStub } from '@dungeonmaster/shared/contracts';

import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';

import { driverHeartbeatTickBroker } from './driver-heartbeat-tick-broker';
import { driverHeartbeatTickBrokerProxy } from './driver-heartbeat-tick-broker.proxy';

// machineStatics.procfs: 4096 bytes per page, 1048576 bytes per megabyte — 256 pages to the MB, so
// 471040 resident pages is exactly 1840MB, the figure the sampler assertions below name.
const RESIDENT_PAGES_FOR_1840MB = 471_040;

describe('driverHeartbeatTickBroker', () => {
  describe('one beat', () => {
    it('VALID: {lane with two pgids} => writes a heartbeat carrying this process pid and the lane pgids, and returns success', async () => {
      const proxy = driverHeartbeatTickBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const pgids = [ProcessGroupIdStub({ value: 4821 }), ProcessGroupIdStub({ value: 4822 })];
      const lane = LaneSessionStub({ pgids });
      const nowMs = 1_700_000_500_000;
      const evidencePath = FilePathStub({
        value:
          '/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_7f3a9c21',
      });
      const row = RegistryEntryStub({ id: instanceId });
      const registry = RegistryStub({ instances: [row] });
      proxy.stageBeatSucceeds({ evidencePath, registryJson: JSON.stringify(registry), nowMs });

      const result = await driverHeartbeatTickBroker({ instanceId, guildId, lane });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getWrittenHeartbeatContent({ evidencePath })).toBe(
        `{"instanceId":"inst_7f3a9c21","pid":"${String(process.pid)}","pgids":[4821,4822],"beatAtMs":${String(nowMs)},"rssMB":null}\n`,
      );
    });
  });

  describe('the profile sample the beat feeds', () => {
    it('VALID: {a beat that measured 1840MB} => hands the sampler that exact reading, its own timestamp and the lane spec', async () => {
      const proxy = driverHeartbeatTickBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const pgids = [ProcessGroupIdStub({ value: 4821 })];
      const lane = LaneSessionStub({ specName: 'dungeonmaster-api', pgids });
      const nowMs = 1_700_000_500_000;
      const evidencePath = FilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/unowned/instances/inst_7f3a9c21',
      });
      const registry = RegistryStub({ instances: [RegistryEntryStub({ id: instanceId })] });
      proxy.stageBeatSucceedsWithMeasuredRss({
        evidencePath,
        registryJson: JSON.stringify(registry),
        nowMs,
        pid: '4821',
        pgrp: 4821,
        residentPages: RESIDENT_PAGES_FOR_1840MB,
      });

      await driverHeartbeatTickBroker({ instanceId, guildId: null, lane });

      expect(proxy.getSampleRecordCalls()).toStrictEqual([
        {
          instanceId: 'inst_7f3a9c21',
          specName: 'dungeonmaster-api',
          rssMB: 1840,
          beatAtMs: nowMs,
        },
      ]);
    });

    it('VALID: {a beat whose measurement failed} => still hands the sampler the null reading rather than skipping it', async () => {
      const proxy = driverHeartbeatTickBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const lane = LaneSessionStub({ specName: 'dungeonmaster-api' });
      const nowMs = 1_700_000_500_000;
      const evidencePath = FilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/unowned/instances/inst_7f3a9c21',
      });
      const registry = RegistryStub({ instances: [RegistryEntryStub({ id: instanceId })] });
      proxy.stageBeatSucceeds({ evidencePath, registryJson: JSON.stringify(registry), nowMs });

      await driverHeartbeatTickBroker({ instanceId, guildId: null, lane });

      expect(proxy.getSampleRecordCalls()).toStrictEqual([
        {
          instanceId: 'inst_7f3a9c21',
          specName: 'dungeonmaster-api',
          rssMB: null,
          beatAtMs: nowMs,
        },
      ]);
    });
  });

  describe('a sampler that fails', () => {
    it('ERROR: {the sample write rejects} => the beat still reports success, and the failure is named on stderr', async () => {
      const proxy = driverHeartbeatTickBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const lane = LaneSessionStub({ specName: 'dungeonmaster-api' });
      const nowMs = 1_700_000_500_000;
      const evidencePath = FilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/unowned/instances/inst_7f3a9c21',
      });
      const registry = RegistryStub({ instances: [RegistryEntryStub({ id: instanceId })] });
      proxy.stageBeatSucceeds({ evidencePath, registryJson: JSON.stringify(registry), nowMs });
      proxy.stageSampleRecordFails({ error: new Error('EACCES: profiles directory unwritable') });

      const result = await driverHeartbeatTickBroker({ instanceId, guildId: null, lane });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getStderrMessages()).toStrictEqual([
        '[heartbeat-tick] recording the profile sample for inst_7f3a9c21 failed, the beat itself ' +
          'stands: Error: EACCES: profiles directory unwritable\n',
      ]);
    });
  });
});
