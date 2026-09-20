/**
 * PURPOSE: One heartbeat beat for the instance this driver process owns — writes this process's own
 * pid, its lane's process-group ids and a fresh timestamp through `heartbeatWriteBroker`, which is
 * the ONLY defence a SIGKILLed driver leaves behind (siegelense-tooling.md line 1672), then folds the
 * RSS that beat measured into the spec's profile. This is the one-shot half only; letting
 * `heartbeatWriteBroker` THROW on a write failure, rather than catching here, is deliberate — the
 * setInterval TICKER that calls this repeatedly owns that catch, because a ticker that lets one bad
 * tick kill the loop stops the only defence there is. The ticker itself lives in the responder that
 * boots the lane, not here and not in `startup/`: a broker's allowed imports exclude `state/`, and
 * `driverSessionState`'s current lane is what the ticker rereads on every tick.
 *
 * **The profile sample is the one thing here that is allowed to fail quietly-but-loudly.** The beat
 * is a defence; a profile is a convenience that makes `capacity` accurate. So a sampler failure is
 * caught, reported on stderr and the beat still reports success — the alternative would trade the
 * only record of this instance's orphaned pgids for a memory figure nothing is blocked on. The
 * sampler is handed the rss and timestamp `heartbeatWriteBroker` already measured, never a second
 * measurement: two readings taken moments apart would disagree, and the heartbeat's is the one that
 * survives on disk.
 *
 * USAGE:
 * await driverHeartbeatTickBroker({ instanceId: InstanceIdStub(), guildId: null, lane: LaneSessionStub() });
 * // Writes heartbeat.json, stamps the registry row's lastBeatMs, folds the reading into the
 * // spec's profile; throws if the heartbeat write fails
 */

import { processIdContract, adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult, GuildId } from '@dungeonmaster/shared/contracts';

import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { heartbeatWriteBroker } from '../../heartbeat/write/heartbeat-write-broker';
import { profileSampleRecordBroker } from '../../profile/sample-record/profile-sample-record-broker';

export const driverHeartbeatTickBroker = async ({
  instanceId,
  guildId,
  lane,
}: {
  instanceId: InstanceId;
  guildId: GuildId | null;
  lane: LaneSession;
}): Promise<AdapterResult> => {
  const heartbeat = await heartbeatWriteBroker({
    instanceId,
    pid: processIdContract.parse(String(process.pid)),
    pgids: lane.pgids,
    guildId,
  });

  await profileSampleRecordBroker({
    instanceId,
    specName: lane.specName,
    rssMB: heartbeat.rssMB,
    beatAtMs: heartbeat.beatAtMs,
  }).catch((error: unknown) => {
    process.stderr.write(
      `[heartbeat-tick] recording the profile sample for ${instanceId} failed, the beat itself stands: ${String(error)}\n`,
    );
  });

  return adapterResultContract.parse({ success: true });
};
