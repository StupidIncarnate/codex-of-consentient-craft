import { FilePathStub, GuildIdStub } from '@dungeonmaster/shared/contracts';

import { InstanceHeartbeatStub } from '../../../contracts/instance-heartbeat/instance-heartbeat.stub';
import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';

import { heartbeatReadBroker } from './heartbeat-read-broker';
import { heartbeatReadBrokerProxy } from './heartbeat-read-broker.proxy';

const HOME_DIR = '/home/user';
const HOME_PATH = FilePathStub({ value: '/home/user/.dungeonmaster' });
const ROOT_PATH = FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' });

describe('heartbeatReadBroker', () => {
  describe('a beat was written', () => {
    it('VALID: {heartbeat.json present} => returns the parsed heartbeat', async () => {
      const proxy = heartbeatReadBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_9b2c0000' });
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const evidencePath = FilePathStub({
        value:
          '/home/user/.dungeonmaster/siegelense/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/instances/inst_9b2c0000',
      });
      const heartbeat = InstanceHeartbeatStub({
        instanceId,
        pgids: [ProcessGroupIdStub({ value: 33_812 })],
        rssMB: 2980,
      });

      proxy.setupHeartbeatFound({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
        heartbeat,
      });

      const result = await heartbeatReadBroker({ instanceId, guildId });

      expect(result).toStrictEqual(heartbeat);
    });
  });

  describe('no beat was ever written', () => {
    it('EMPTY: {heartbeat.json absent} => returns null', async () => {
      const proxy = heartbeatReadBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_9b2c0000' });
      const evidencePath = FilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/unowned/instances/inst_9b2c0000',
      });

      proxy.setupHeartbeatMissing({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
      });

      const result = await heartbeatReadBroker({ instanceId, guildId: null });

      expect(result).toBe(null);
    });
  });

  describe('the read fails for a reason other than absence', () => {
    it('ERROR: {EACCES} => rejects rather than treating it as missing', async () => {
      const proxy = heartbeatReadBrokerProxy();
      const instanceId = InstanceIdStub({ value: 'inst_9b2c0000' });
      const evidencePath = FilePathStub({
        value: '/home/user/.dungeonmaster/siegelense/unowned/instances/inst_9b2c0000',
      });

      proxy.setupHeartbeatReadFails({
        homeDir: HOME_DIR,
        homePath: HOME_PATH,
        rootPath: ROOT_PATH,
        evidencePath,
        error: Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' }),
      });

      await expect(heartbeatReadBroker({ instanceId, guildId: null })).rejects.toThrow(
        `Failed to read file at ${evidencePath}/heartbeat.json`,
      );
    });
  });
});
