/**
 * PURPOSE: One heartbeat beat for the instance this driver process owns — writes this process's own
 * pid, its lane's process-group ids and a fresh timestamp through `heartbeatWriteBroker`, which is
 * the ONLY defence a SIGKILLed driver leaves behind (siegelense-tooling.md line 1672). This is the
 * one-shot half only; letting `heartbeatWriteBroker` THROW on a write failure, rather than catching
 * here, is deliberate — the setInterval TICKER that calls this repeatedly owns that catch, because a
 * ticker that lets one bad tick kill the loop stops the only defence there is. The ticker itself
 * lives in the responder that boots the lane, not here and not in `startup/`: a broker's allowed
 * imports exclude `state/`, and `driverSessionState`'s current lane is what the ticker rereads on
 * every tick.
 *
 * USAGE:
 * await driverHeartbeatTickBroker({ instanceId: InstanceIdStub(), guildId: null, lane: LaneSessionStub() });
 * // Writes heartbeat.json and stamps the registry row's lastBeatMs; throws if the write fails
 */

import { processIdContract, adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult, GuildId } from '@dungeonmaster/shared/contracts';

import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { heartbeatWriteBroker } from '../../heartbeat/write/heartbeat-write-broker';

export const driverHeartbeatTickBroker = async ({
  instanceId,
  guildId,
  lane,
}: {
  instanceId: InstanceId;
  guildId: GuildId | null;
  lane: LaneSession;
}): Promise<AdapterResult> => {
  await heartbeatWriteBroker({
    instanceId,
    pid: processIdContract.parse(String(process.pid)),
    pgids: lane.pgids,
    guildId,
  });

  return adapterResultContract.parse({ success: true });
};
