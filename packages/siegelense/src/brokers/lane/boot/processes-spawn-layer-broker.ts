/**
 * PURPOSE: Spawns every resolved `LaneLaunch` detached (its stdout/stderr redirected to the launch's
 * own append-mode log fd) and waits every launch with a `readyUrl` against ONE shared deadline of
 * `bootTimeoutMs`, so a slow process never buys the others extra time. `lane-boot-broker` calls it
 * for the first boot and again from the lane's `startProcesses` on a `reset level: 'instance'`
 * restart — the same launches both times, which is what keeps the ports, home, env, args and log
 * files identical across a restart. It never kills or cleans up on its own: what to do with an
 * unready launch differs between a failed boot and a failed restart, so the caller decides.
 *
 * USAGE:
 * await processesSpawnLayerBroker({ launches: [LaneLaunchStub()], cwd, bootTimeoutMs: TimeoutMsStub() });
 * // Returns { pgids: [one per launch, in launch order], unready: [every launch that never answered] }
 */

import type { AbsoluteFilePath, TimeoutMs } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnDetachedAdapter } from '../../../adapters/child-process/spawn-detached/child-process-spawn-detached-adapter';
import type { LaneLaunch } from '../../../contracts/lane-launch/lane-launch-contract';
import type { ProcessGroupId } from '../../../contracts/process-group-id/process-group-id-contract';
import { laneReadyWaitBroker } from '../ready-wait/lane-ready-wait-broker';

export const processesSpawnLayerBroker = async ({
  launches,
  cwd,
  bootTimeoutMs,
}: {
  launches: readonly LaneLaunch[];
  cwd: AbsoluteFilePath;
  bootTimeoutMs: TimeoutMs;
}): Promise<{ pgids: readonly ProcessGroupId[]; unready: readonly LaneLaunch[] }> => {
  const pgids = launches.map(
    (launch) =>
      childProcessSpawnDetachedAdapter({
        command: launch.command,
        args: [...launch.args],
        cwd,
        env: launch.env,
        stdoutFd: launch.fd,
        stderrFd: launch.fd,
      }).pgid,
  );

  const deadlineMs = Date.now() + bootTimeoutMs;

  const readiness = await Promise.all(
    launches.map(async (launch) =>
      launch.readyUrl === null ? true : laneReadyWaitBroker({ url: launch.readyUrl, deadlineMs }),
    ),
  );

  return {
    pgids,
    unready: launches.filter((_launch, index) => readiness[index] !== true),
  };
};
