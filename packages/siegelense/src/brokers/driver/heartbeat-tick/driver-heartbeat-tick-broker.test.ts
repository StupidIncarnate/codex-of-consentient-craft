import { FilePathStub, GuildIdStub } from '@dungeonmaster/shared/contracts';

import { InstanceIdStub } from '../../../contracts/instance-id/instance-id.stub';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import { RegistryEntryStub } from '../../../contracts/registry-entry/registry-entry.stub';
import { RegistryStub } from '../../../contracts/registry/registry.stub';

import { driverHeartbeatTickBroker } from './driver-heartbeat-tick-broker';
import { driverHeartbeatTickBrokerProxy } from './driver-heartbeat-tick-broker.proxy';

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
});
