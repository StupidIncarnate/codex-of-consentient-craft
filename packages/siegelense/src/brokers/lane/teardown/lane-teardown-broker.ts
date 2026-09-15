/**
 * PURPOSE: Tears down one booted lane. `kill` removes the throwaway STATE and never the evidence —
 * `session.homePath` is a `/tmp` scratch dir with nothing a fixer needs, so it goes; `session.evidencePath`
 * holds the logs, captures and transcript that were the whole point of the walk, so this broker never
 * passes it to `fsRmAdapter` and never even resolves it for removal — only for the repo-local `Read`
 * path a fixer opens once the instance is gone (siegelense-tooling.md lines 1107-1109, 1680;
 * packages/siegelense/CLAUDE.md). The kill escalation is SIGTERM, `driverStatics.teardown.graceMs`,
 * then SIGKILL, and a process group `processIsAliveAdapter` already reports dead gets NEITHER signal —
 * one liveness check up front gates both passes, so a clean teardown never asks `kill` to hit a pid
 * that is already gone. A browser-close failure is reported (fire-and-forget, matching this repo's
 * `.catch` convention) rather than swallowed, but never skips the process-group kill that follows it —
 * a broken browser must not leave two live servers mislabeled as torn down. Every `session.logFds`
 * descriptor — the killed processes' own stdout/stderr redirects `lane-boot-broker` opened — is closed
 * only AFTER the SIGKILL pass, matching the order `lane-boot-broker`'s own failure path already uses
 * (kill first, close fd after): severing a still-writing process's redirect out from under it is a
 * different failure than closing it once the group is confirmed dead. A close failure is reported the
 * same way a browser-close failure is above — logged, never thrown — so one bad descriptor neither
 * skips the rest of the fds nor the home removal that follows (siegelense-tooling.md line 1083).
 *
 * USAGE:
 * const result = await laneTeardownBroker({ session, instanceId });
 * // Kills every live process group, closes every session.logFds descriptor, removes session.homePath,
 * // leaves session.evidencePath standing, and returns a KillResult naming the released ports and the
 * // repo-local evidence path
 */

import { driverStatics } from '../../../statics/driver/driver-statics';
import { processKillGroupAdapter } from '../../../adapters/process/kill-group/process-kill-group-adapter';
import { processIsAliveAdapter } from '../../../adapters/process/is-alive/process-is-alive-adapter';
import { fsCloseFdAdapter } from '../../../adapters/fs/close-fd/fs-close-fd-adapter';
import { fsRmAdapter } from '../../../adapters/fs/rm/fs-rm-adapter';
import { locationsRepoLinkPathFindBroker } from '../../locations/repo-link-path-find/locations-repo-link-path-find-broker';
import { killResultContract } from '../../../contracts/kill-result/kill-result-contract';
import type { KillResult } from '../../../contracts/kill-result/kill-result-contract';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';

export const laneTeardownBroker = async ({
  session,
  instanceId,
}: {
  session: LaneSession;
  instanceId: InstanceId;
}): Promise<KillResult> => {
  if (session.browser !== null) {
    await session.browser.close().catch((error: unknown) => {
      process.stderr.write(
        `[lane-teardown] browser close failed for instance ${instanceId}: ${String(error)}\n`,
      );
    });
  }

  // One liveness check per pgid, up front, gates BOTH signal passes for that group — the dead ones
  // never see a SIGTERM or a SIGKILL, so a clean teardown against an already-exited group never
  // attempts a signal `processKillGroupAdapter` would otherwise have to swallow.
  const liveTargets = session.pgids.filter((pgid) => processIsAliveAdapter({ pgid }));

  // Nothing to escalate against — skip the SIGTERM send and the grace wait entirely rather than
  // pausing a headless teardown for no live group. When there IS at least one target,
  // `sigtermSentAtMs` is captured BEFORE the loop below sends any signal, so the grace is counted
  // from when SIGTERM actually started going out — any real time the signalling loop itself spent
  // is subtracted from the wait instead of stacking on top of the full grace period.
  if (liveTargets.length > 0) {
    const sigtermSentAtMs = Date.now();

    liveTargets.forEach((pgid) => {
      processKillGroupAdapter({ pgid, signal: 'SIGTERM' });
    });

    const elapsedSinceSigtermMs = Date.now() - sigtermSentAtMs;
    const remainingGraceMs = Math.max(0, driverStatics.teardown.graceMs - elapsedSinceSigtermMs);

    await new Promise<void>((resolve) => {
      setTimeout(resolve, remainingGraceMs);
    });
  }

  liveTargets.forEach((pgid) => {
    processKillGroupAdapter({ pgid, signal: 'SIGKILL' });
  });

  // Every fd here is a killed process's own stdout/stderr redirect. Closing only now — after both
  // signal passes, never before or interleaved with them — means a still-writing process never has
  // its own redirect severed out from under it; `lane-boot-broker`'s failure path uses this same
  // kill-then-close order. A close failure is reported like the browser-close failure above rather
  // than thrown, so one bad descriptor neither skips the remaining fds nor the home removal below.
  session.logFds.forEach((fd) => {
    try {
      fsCloseFdAdapter({ fd });
    } catch (error) {
      process.stderr.write(
        `[lane-teardown] fd close failed for instance ${instanceId}, fd ${String(fd)}: ${String(error)}\n`,
      );
    }
  });

  const [, evidenceKept] = await Promise.all([
    fsRmAdapter({ dirPath: session.homePath }),
    locationsRepoLinkPathFindBroker({ homePath: session.evidencePath }),
  ]);

  return killResultContract.parse({
    instanceId,
    stopped: true,
    portsReleased: [session.ports.api, session.ports.web],
    homeRemoved: true,
    evidenceKept,
    reapedPgids: [],
  });
};
