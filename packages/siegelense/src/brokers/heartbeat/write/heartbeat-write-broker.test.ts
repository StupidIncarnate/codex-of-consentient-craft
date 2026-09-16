import { FilePathStub, GuildIdStub, ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { EpochMsStub } from '../../../contracts/epoch-ms/epoch-ms.stub';
import { InstanceHeartbeatStub } from '../../../contracts/instance-heartbeat/instance-heartbeat.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';

import { heartbeatWriteBroker } from './heartbeat-write-broker';
import { heartbeatWriteBrokerProxy } from './heartbeat-write-broker.proxy';

const HOME_DIR = '/home/user';
const HOME_PATH = FilePathStub({ value: '/home/user/.dungeonmaster' });
const ROOT_PATH = FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' });

describe('heartbeatWriteBroker', () => {
  describe('a guild owns the instance', () => {
    it('VALID: {a guild-owned instance} => writes heartbeat.json under the guild partition and stamps the row', async () => {
      const proxy = heartbeatWriteBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const pid = ProcessIdStub({ value: 'proc-12345' });
      const pgids = [ProcessGroupIdStub({ value: 4821 })];
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const nowMs = 1_700_000_500_000;
      const evidencePath = FilePathStub({
        value:
          '/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_7f3a9c21',
      });
      const row = RegistryEntryStub({ id: instanceId });
      const registry = RegistryStub({ instances: [row] });

      proxy.setupHeartbeatWrite({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
        registryJson: JSON.stringify(registry),
        nowMs,
      });

      const result = await heartbeatWriteBroker({ instanceId, pid, pgids, guildId });

      const expectedHeartbeat = InstanceHeartbeatStub({
        instanceId,
        pid,
        pgids,
        beatAtMs: EpochMsStub({ value: nowMs }),
      });

      expect(result).toStrictEqual(expectedHeartbeat);
      expect(proxy.getWrittenHeartbeatPath({ evidencePath })).toBe(
        '/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_7f3a9c21/heartbeat.json',
      );
      expect(proxy.getWrittenHeartbeatContent({ evidencePath })).toBe(
        `${JSON.stringify(expectedHeartbeat)}\n`,
      );

      const expectedRegistry = RegistryStub({
        instances: [{ ...row, lastBeatMs: EpochMsStub({ value: nowMs }) }],
      });

      expect(proxy.getRegistryWrittenContent()).toBe(`${JSON.stringify(expectedRegistry)}\n`);
    });
  });

  describe('no quest dispatched the instance', () => {
    it('EMPTY: {guildId: null} => writes heartbeat.json under unowned/', async () => {
      const proxy = heartbeatWriteBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const pid = ProcessIdStub({ value: 'proc-12345' });
      const pgids = [ProcessGroupIdStub({ value: 4821 })];
      const nowMs = 1_700_000_500_000;
      const evidencePath = FilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/unowned/instances/inst_7f3a9c21',
      });
      const row = RegistryEntryStub({ id: instanceId });
      const registry = RegistryStub({ instances: [row] });

      proxy.setupHeartbeatWrite({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
        registryJson: JSON.stringify(registry),
        nowMs,
      });

      await heartbeatWriteBroker({ instanceId, pid, pgids, guildId: null });

      expect(proxy.getWrittenHeartbeatPath({ evidencePath })).toBe(
        '/home/user/.dungeonmaster/siegelense/unowned/instances/inst_7f3a9c21/heartbeat.json',
      );
    });
  });

  describe('several children', () => {
    it('VALID: {several pgids} => every pgid reaches the file', async () => {
      const proxy = heartbeatWriteBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const pid = ProcessIdStub({ value: 'proc-12345' });
      const pgids = [
        ProcessGroupIdStub({ value: 4821 }),
        ProcessGroupIdStub({ value: 4822 }),
        ProcessGroupIdStub({ value: 4823 }),
      ];
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const nowMs = 1_700_000_500_000;
      const evidencePath = FilePathStub({
        value:
          '/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_7f3a9c21',
      });
      const row = RegistryEntryStub({ id: instanceId });
      const registry = RegistryStub({ instances: [row] });

      proxy.setupHeartbeatWrite({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
        registryJson: JSON.stringify(registry),
        nowMs,
      });

      await heartbeatWriteBroker({ instanceId, pid, pgids, guildId });

      const expectedHeartbeat = InstanceHeartbeatStub({
        instanceId,
        pid,
        pgids,
        beatAtMs: EpochMsStub({ value: nowMs }),
      });

      expect(proxy.getWrittenHeartbeatContent({ evidencePath })).toBe(
        `${JSON.stringify(expectedHeartbeat)}\n`,
      );
    });
  });

  describe('the pgids have a measurable rss', () => {
    it('VALID: {pgids with a measurable rss} => the written heartbeat carries rssMB', async () => {
      const proxy = heartbeatWriteBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const pid = ProcessIdStub({ value: 'proc-12345' });
      const pgids = [ProcessGroupIdStub({ value: 4821 })];
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const nowMs = 1_700_000_500_000;
      const evidencePath = FilePathStub({
        value:
          '/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_7f3a9c21',
      });
      const row = RegistryEntryStub({ id: instanceId });
      const registry = RegistryStub({ instances: [row] });

      proxy.setupHeartbeatWriteWithMeasuredRss({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
        registryJson: JSON.stringify(registry),
        nowMs,
        pid: '100',
        pgrp: 4821,
        residentPages: 2560,
      });

      const result = await heartbeatWriteBroker({ instanceId, pid, pgids, guildId });

      // (2560 pages * 4096 bytes/page) / 1_048_576 bytes/MB = 10 MB exactly.
      const expectedHeartbeat = InstanceHeartbeatStub({
        instanceId,
        pid,
        pgids,
        beatAtMs: EpochMsStub({ value: nowMs }),
        rssMB: 10,
      });

      expect(result).toStrictEqual(expectedHeartbeat);
      expect(proxy.getWrittenHeartbeatContent({ evidencePath })).toBe(
        `${JSON.stringify(expectedHeartbeat)}\n`,
      );
    });
  });

  describe('the registry has no row for this instance', () => {
    it('EMPTY: {no matching registry row} => writes heartbeat.json and leaves the registry unchanged', async () => {
      const proxy = heartbeatWriteBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_7f3a9c21' });
      const otherInstanceId = InstanceIdStub({ value: 'inst_00000000' });
      const pid = ProcessIdStub({ value: 'proc-12345' });
      const pgids = [ProcessGroupIdStub({ value: 4821 })];
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const nowMs = 1_700_000_500_000;
      const evidencePath = FilePathStub({
        value:
          '/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_7f3a9c21',
      });
      const unrelatedRow = RegistryEntryStub({ id: otherInstanceId });
      const registry = RegistryStub({ instances: [unrelatedRow] });

      proxy.setupHeartbeatWrite({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
        registryJson: JSON.stringify(registry),
        nowMs,
      });

      await heartbeatWriteBroker({ instanceId, pid, pgids, guildId });

      const expectedHeartbeat = InstanceHeartbeatStub({
        instanceId,
        pid,
        pgids,
        beatAtMs: EpochMsStub({ value: nowMs }),
      });

      expect(proxy.getWrittenHeartbeatContent({ evidencePath })).toBe(
        `${JSON.stringify(expectedHeartbeat)}\n`,
      );
      expect(proxy.getRegistryWrittenContent()).toBe(`${JSON.stringify(registry)}\n`);
    });
  });
});
