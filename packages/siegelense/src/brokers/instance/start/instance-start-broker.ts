/**
 * PURPOSE: The thin client half of `start` — opportunistically reaps any instance whose heartbeat
 * has gone cold (spec line 1673: the only recovery path there is, and a silent reap reads as a
 * bug, so each one is reported on stderr), reserves a NEW instance BEFORE anything boots (spec
 * line 1619: otherwise three sessions each divide free memory by peak and six boot), acquires
 * `boot.lock` so at most one boot runs at a time across every process on the machine, spawns the
 * driver process detached, and polls its socket until it answers or the boot deadline passes. The
 * driver releases `boot.lock` itself once its OWN boot finishes (line 1620 — the lock covers the
 * boot, and the boot finishes inside the driver), so this broker releases it ONLY on a path the
 * driver never reached: any throw between acquiring the lock and the driver's first successful
 * `ping`, including the ping timing out. A lock left held by a boot that threw wedges every other
 * session until the TTL expires.
 *
 * `home` is never written to the registry (the driver computes it privately when it boots the
 * lane), so this broker derives the SAME deterministic value from `instanceId` alone — the
 * convention every other siegelense OS-tmp path in this package already follows (see
 * `locationsSocketPathFindBroker`).
 *
 * USAGE:
 * await instanceStartBroker({ specName: SpecNameStub(), questId: null, guildId: null });
 * // Returns an InstanceManifest once the driver answers `ping`, or throws LaneBootFailedError
 */

import { pathJoinAdapter, processCwdAdapter } from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  contentTextContract,
  type GuildId,
  type QuestId,
} from '@dungeonmaster/shared/contracts';
import { environmentStatics, locationsStatics } from '@dungeonmaster/shared/statics';
import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';

import { childProcessSpawnDetachedAdapter } from '../../../adapters/child-process/spawn-detached/child-process-spawn-detached-adapter';
import { fsOpenFdAdapter } from '../../../adapters/fs/open-fd/fs-open-fd-adapter';
import { osTmpdirAdapter } from '../../../adapters/os/tmpdir/os-tmpdir-adapter';
import { instanceStartBootPollLayerBroker } from './instance-start-boot-poll-layer-broker';
import { bootLockAcquireBroker } from '../../boot-lock/acquire/boot-lock-acquire-broker';
import { bootLockReleaseBroker } from '../../boot-lock/release/boot-lock-release-broker';
import { isStaleRegistryEntryGuard } from '../../../guards/is-stale-registry-entry/is-stale-registry-entry-guard';
import { instanceKillBroker } from '../kill/instance-kill-broker';
import { locationsInstanceEvidencePathFindBroker } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker';
import { locationsRepoLinkPathFindBroker } from '../../locations/repo-link-path-find/locations-repo-link-path-find-broker';
import { locationsSocketPathFindBroker } from '../../locations/socket-path-find/locations-socket-path-find-broker';
import { instanceReserveBroker } from '../reserve/instance-reserve-broker';
import { registryReadBroker } from '../../registry/read/registry-read-broker';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { instanceManifestContract } from '../../../contracts/instance-manifest/instance-manifest-contract';
import type { InstanceManifest } from '../../../contracts/instance-manifest/instance-manifest-contract';
import { laneSpecFindBroker } from '../../lane-spec/find/lane-spec-find-broker';
import { laneSpecHashBroker } from '../../lane-spec/hash/lane-spec-hash-broker';
import { readingCountContract } from '../../../contracts/reading-count/reading-count-contract';
import type { SpecName } from '../../../contracts/spec-name/spec-name-contract';
import { driverStatics } from '../../../statics/driver/driver-statics';
import { LaneBootFailedError } from '../../../errors/lane-boot-failed/lane-boot-failed-error';

export const instanceStartBroker = async ({
  specName,
  questId,
  guildId,
}: {
  specName: SpecName;
  questId: QuestId | null;
  guildId: GuildId | null;
}): Promise<InstanceManifest> => {
  const spec = laneSpecFindBroker({ specName });
  const specHash = laneSpecHashBroker({ spec });

  const registryBeforeReserve = await registryReadBroker();
  const aheadOfMe = readingCountContract.parse(
    registryBeforeReserve.instances.filter((candidate) => candidate.bootedAtMs === null).length,
  );

  // Opportunistic reap: any instance whose heartbeat has gone cold is presumed dead (spec line
  // 1673) — there is no other recovery path, so a caught-but-unreported reap is indistinguishable
  // from a bug. instanceKillBroker IS the reap path (kill's own docstring: "cleanup will call the
  // same broker" for exactly this) — its socket attempt fails against a driver that already went
  // silent, and its orphan-reap branch signals the recorded pgids and releases the row. Never
  // treated as pruning: nothing here removes evidence, only the throwaway home and the tombstoned
  // registry row a dead process left behind.
  const nowMsForStaleness = epochMsContract.parse(Date.now());
  const staleEntries = registryBeforeReserve.instances.filter(
    (candidate) =>
      candidate.state === 'alive' &&
      isStaleRegistryEntryGuard({ entry: candidate, nowMs: nowMsForStaleness }),
  );

  await Promise.all(
    staleEntries.map(async (staleEntry) => {
      const reapResult = await instanceKillBroker({ instanceId: staleEntry.id });
      process.stderr.write(
        `instanceStartBroker: reaped stale instance ${staleEntry.id} — heartbeat gone cold, signalled pgids [${reapResult.reapedPgids.join(', ')}]\n`,
      );
    }),
  );

  const reservedEntry = await instanceReserveBroker({ specName, specHash, questId, guildId });

  const lockWaitStartedAtMs = epochMsContract.parse(Date.now());
  await bootLockAcquireBroker({ instanceId: reservedEntry.id });
  const lockWaitEndedAtMs = epochMsContract.parse(Date.now());
  const queuedMs = epochMsContract.parse(lockWaitEndedAtMs - lockWaitStartedAtMs);

  try {
    const evidencePath = locationsInstanceEvidencePathFindBroker({
      instanceId: reservedEntry.id,
      guildId,
    });
    const driverLogPath = absoluteFilePathContract.parse(
      pathJoinAdapter({ paths: [evidencePath, locationsStatics.siegelense.driverLog] }),
    );
    const driverLogFd = fsOpenFdAdapter({ filePath: driverLogPath });

    const cwdSeed = processCwdAdapter();
    const repoRoot = await cwdResolveBroker({ startPath: cwdSeed, kind: 'repo-root' });

    childProcessSpawnDetachedAdapter({
      command: 'dungeonmaster',
      // `locationsStatics.siegelense.dir` doubles as the CLI subcommand name here — both are the
      // literal string 'siegelense', and `no-bare-location-literals` bans typing it a second time.
      args: [locationsStatics.siegelense.dir, 'driver', '--instance', reservedEntry.id],
      cwd: absoluteFilePathContract.parse(repoRoot),
      stdoutFd: driverLogFd,
      stderrFd: driverLogFd,
    });

    const socketPath = locationsSocketPathFindBroker({ instanceId: reservedEntry.id });
    const bootStartedAtMs = epochMsContract.parse(Date.now());
    const bootDeadlineMs = epochMsContract.parse(
      bootStartedAtMs + driverStatics.boot.defaultTimeoutMs,
    );

    const bootAnswered = await instanceStartBootPollLayerBroker({
      socketPath,
      deadlineMs: bootDeadlineMs,
    });

    if (!bootAnswered) {
      throw new LaneBootFailedError({
        specName: spec.name,
        instanceId: reservedEntry.id,
        unready: spec.processes.map((laneProcess) => laneProcess.name),
        logPaths: [driverLogPath],
      });
    }

    const bootEndedAtMs = epochMsContract.parse(Date.now());
    const bootMs = epochMsContract.parse(bootEndedAtMs - bootStartedAtMs);

    const registryAfterBoot = await registryReadBroker();
    const bootedEntry = registryAfterBoot.instances.find(
      (candidate) => candidate.id === reservedEntry.id,
    );
    if (bootedEntry === undefined) {
      throw new Error(
        `instanceStartBroker: ${reservedEntry.id} not found in the registry after boot`,
      );
    }

    const homePath = absoluteFilePathContract.parse(
      pathJoinAdapter({ paths: [osTmpdirAdapter(), `dm-siege-${reservedEntry.id}`] }),
    );
    const apiLogPath = absoluteFilePathContract.parse(
      pathJoinAdapter({ paths: [evidencePath, locationsStatics.siegelense.apiLog] }),
    );
    const webLogPath = absoluteFilePathContract.parse(
      pathJoinAdapter({ paths: [evidencePath, locationsStatics.siegelense.webLog] }),
    );

    const [evidenceRepoLocal, apiLogRepoLocal, webLogRepoLocal] = await Promise.all([
      locationsRepoLinkPathFindBroker({ homePath: evidencePath }),
      locationsRepoLinkPathFindBroker({ homePath: apiLogPath }),
      locationsRepoLinkPathFindBroker({ homePath: webLogPath }),
    ]);

    return instanceManifestContract.parse({
      instanceId: reservedEntry.id,
      specName,
      baseUrl: contentTextContract.parse(
        `http://${environmentStatics.hostname}:${String(bootedEntry.ports.web)}`,
      ),
      home: homePath,
      evidence: evidenceRepoLocal,
      logs: { api: apiLogRepoLocal, web: webLogRepoLocal },
      queuedMs,
      aheadOfMe,
      bootMs,
    });
  } catch (bootError) {
    await bootLockReleaseBroker({ instanceId: reservedEntry.id });
    throw bootError;
  }
};
