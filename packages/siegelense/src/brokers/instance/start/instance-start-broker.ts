/**
 * PURPOSE: The thin client half of `start` — opportunistically reaps any instance whose heartbeat
 * has gone cold (spec line 1673: the only recovery path there is, and a silent reap reads as a
 * bug, so each one is reported on stderr), REFUSES outright when `capacity` answers `suggested: 0`
 * (spec lines 1588-1590 — the one hard edge in an otherwise advisory reading, because the
 * alternative is the OS killing something at random), reserves a NEW instance BEFORE anything boots
 * (spec line 1619: otherwise three sessions each divide free memory by peak and six boot), acquires
 * `boot.lock` so at most one boot runs at a time across every process on the machine, spawns the
 * driver process detached, and polls its socket until it answers or the boot deadline passes. The
 * driver releases `boot.lock` itself once its OWN boot finishes (line 1620 — the lock covers the
 * boot, and the boot finishes inside the driver), so this broker releases it ONLY on a path the
 * driver never reached: any throw between acquiring the lock and the driver's first successful
 * `ping`, including the ping timing out. A lock left held by a boot that threw wedges every other
 * session until the TTL expires.
 *
 * `seed` runs a recipe against the lane once it answers, and its returned ids ride back on the
 * manifest's `seeded` field. It runs from this side rather than down the driver socket because this
 * side already holds the booted lane's api port and the deterministic home; a seed that throws
 * takes the same teardown path every other boot failure takes, because a lane whose state is not
 * what the caller asked for is not a lane the caller should be handed.
 *
 * A successful boot also RECORDS what it cost, through `profileBootRecordBroker` — this is the only
 * side that watches a boot from its first moment, so nothing else can measure `bootMs` (spec line
 * 1483). That write is caught and reported rather than awaited bare: a profile is a convenience
 * `capacity` reads, and a failed profile write must never tear down an instance that booted fine.
 *
 * `home` is never written to the registry (the driver computes it privately when it boots the
 * lane), so this broker derives the SAME deterministic value from `instanceId` alone — the
 * convention every other siegelense OS-tmp path in this package already follows (see
 * `locationsSocketPathFindBroker`). The manifest's `baseUrl` is `null` for a spec whose processes
 * never claim the `web` portRole — a `dungeonmaster-api` boot has nothing listening there —
 * rather than a URL built unconditionally off a port nothing binds. The boot poll's outcome decides
 * which of two errors reaches the caller: a `'failed'` status means the driver caught its own error
 * and left a `boot-failure.json` marker before exiting, so `DriverBootFailedError` carries that
 * message straight through; a `'timeout'` status means the poll ran out its deadline with no such
 * report, so `LaneBootFailedError.unready` names only the processes THIS broker can confirm are
 * still not answering their own readyPath, probed directly rather than assumed to be every process
 * the spec declares. Either throw releases the reservation `instanceReserveBroker` minted for this
 * attempt (via `instanceReleaseBroker`, tombstoning the row rather than deleting it) alongside
 * `boot.lock` — a failed boot must leave the registry as it found it, not holding a port pair with
 * no process behind it forever.
 *
 * USAGE:
 * await instanceStartBroker({ specName: SpecNameStub(), questId: null, guildId: null, seed: null });
 * // Returns an InstanceManifest once the driver answers `ping`, or throws DriverBootFailedError /
 * // LaneBootFailedError after releasing boot.lock and this attempt's reservation
 *
 * await instanceStartBroker({
 *   specName: SpecNameStub(),
 *   questId: null,
 *   guildId: null,
 *   seed: RecipeNameStub({ value: 'guild-with-three-quests' }),
 *   idleTimeoutMs: TimeoutMsStub({ value: 1_800_000 }),
 * });
 * // Same, but appends `--idle-timeout-ms 1800000` to the spawned driver's own argv, raising the
 * // ceiling that instance reaps itself against above driverStatics.idle.timeoutMs
 */

import { pathJoinAdapter, processCwdAdapter } from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  contentTextContract,
  type ContentText,
  type GuildId,
  type QuestId,
  type TimeoutMs,
} from '@dungeonmaster/shared/contracts';
import { environmentStatics, locationsStatics } from '@dungeonmaster/shared/statics';
import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';

import type { RecipeName } from '../../../contracts/recipe-name/recipe-name-contract';

import { childProcessSpawnDetachedAdapter } from '../../../adapters/child-process/spawn-detached/child-process-spawn-detached-adapter';
import { cliPackageBinResolveAdapter } from '../../../adapters/cli-package/bin-resolve/cli-package-bin-resolve-adapter';
import { fsOpenFdAdapter } from '../../../adapters/fs/open-fd/fs-open-fd-adapter';
import { osTmpdirAdapter } from '../../../adapters/os/tmpdir/os-tmpdir-adapter';
import { instanceStartBootPollLayerBroker } from './instance-start-boot-poll-layer-broker';
import { bootLockAcquireBroker } from '../../boot-lock/acquire/boot-lock-acquire-broker';
import { capacityReadBroker } from '../../capacity/read/capacity-read-broker';
import { CapacityRefusedError } from '../../../errors/capacity-refused/capacity-refused-error';
import { bootLockReleaseBroker } from '../../boot-lock/release/boot-lock-release-broker';
import { isReservedRegistryEntryGuard } from '../../../guards/is-reserved-registry-entry/is-reserved-registry-entry-guard';
import { isStaleRegistryEntryGuard } from '../../../guards/is-stale-registry-entry/is-stale-registry-entry-guard';
import { instanceKillBroker } from '../kill/instance-kill-broker';
import { laneReadyWaitBroker } from '../../lane/ready-wait/lane-ready-wait-broker';
import { locationsInstanceEvidencePathFindBroker } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker';
import { locationsRepoLinkPathFindBroker } from '../../locations/repo-link-path-find/locations-repo-link-path-find-broker';
import { locationsSocketPathFindBroker } from '../../locations/socket-path-find/locations-socket-path-find-broker';
import { instanceReleaseBroker } from '../release/instance-release-broker';
import { instanceReserveBroker } from '../reserve/instance-reserve-broker';
import { profileBootRecordBroker } from '../../profile/boot-record/profile-boot-record-broker';
import { recipeSeedRunBroker } from '../../recipe/seed-run/recipe-seed-run-broker';
import { registryReadBroker } from '../../registry/read/registry-read-broker';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { instanceManifestContract } from '../../../contracts/instance-manifest/instance-manifest-contract';
import type { InstanceManifest } from '../../../contracts/instance-manifest/instance-manifest-contract';
import type { LaneProcessName } from '../../../contracts/lane-process-name/lane-process-name-contract';
import { laneSpecFindBroker } from '../../lane-spec/find/lane-spec-find-broker';
import { laneSpecHashBroker } from '../../lane-spec/hash/lane-spec-hash-broker';
import { readingCountContract } from '../../../contracts/reading-count/reading-count-contract';
import type { SpecName } from '../../../contracts/spec-name/spec-name-contract';
import { driverStatics } from '../../../statics/driver/driver-statics';
import { DriverBootFailedError } from '../../../errors/driver-boot-failed/driver-boot-failed-error';
import { LaneBootFailedError } from '../../../errors/lane-boot-failed/lane-boot-failed-error';
import { laneProcessPortResolveTransformer } from '../../../transformers/lane-process-port-resolve/lane-process-port-resolve-transformer';

export const instanceStartBroker = async ({
  specName,
  questId,
  guildId,
  seed,
  idleTimeoutMs,
}: {
  specName: SpecName;
  questId: QuestId | null;
  guildId: GuildId | null;
  seed: RecipeName | null;
  idleTimeoutMs?: TimeoutMs;
}): Promise<InstanceManifest> => {
  const spec = await laneSpecFindBroker({ specName });
  const specHash = laneSpecHashBroker({ spec });

  const registryBeforeReserve = await registryReadBroker();
  // `state === 'alive'` is load-bearing, not belt-and-braces: a boot that died before it finished
  // leaves a `killed` row whose `bootedAtMs` stays null forever, and a tombstone is never deleted
  // (spec line 219 — assets outlive their instance). Counting on `bootedAtMs` alone therefore
  // makes `aheadOfMe` climb by one per failed boot and never come down — measured at 3 on a
  // machine whose fleet was empty, against three killed rows that never booted. Both other
  // readers of this guard (`cleanupRunBroker`, `instanceStateResolveBroker`) filter the same way
  // first, which is the shape the guard's own docstring assumes.
  const aheadOfMe = readingCountContract.parse(
    registryBeforeReserve.instances.filter(
      (candidate) =>
        candidate.state === 'alive' && isReservedRegistryEntryGuard({ entry: candidate }),
    ).length,
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

  // `capacity` is advisory everywhere except here (spec lines 1588-1590): starting an instance the
  // machine plainly cannot hold ends with the OS killing something at random, which is worse than a
  // refusal. Read AFTER the opportunistic reap above, so a fleet of cold lanes is cleared before it
  // is counted, and BEFORE instanceReserveBroker, so a refusal leaves no reservation and no claimed
  // port pair behind. `suggested: 0` is both refusals the spec asks for — no room in memory for one
  // more, and the pool size already full (line 1540, the chunk-2 marker's own NOT YET) — and the
  // `why` sentence carried into the error says which of the two fired. `poolSize: null` takes
  // capacity's own default, the most CONTENDED group the profile holds: a refusal should err toward
  // refusing rather than toward an OOM.
  const capacity = await capacityReadBroker({ specName, poolSize: null });
  if (capacity.suggested === 0) {
    throw new CapacityRefusedError({ specName, why: capacity.why });
  }

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

    // Spawns the CLI's own resolved bin script through the CURRENT node binary rather than the
    // bare command 'dungeonmaster' — PATH can resolve that name to an unrelated checkout (a
    // global npm link, a second session's worktree, an older consumer install), and the wrong
    // binary boots quietly, reading back as a boot timeout rather than as the wrong process. See
    // cliPackageBinResolveAdapter's own PURPOSE for how it locates the right one everywhere.
    const driverBinPath = cliPackageBinResolveAdapter();

    // `env` must be passed explicitly, never omitted. Leaving it undefined asks Node to default to
    // `process.env`, and from inside a live Jest worker that default resolves against a STALE
    // snapshot taken before the test process's own mutations — measured directly: a jest test that
    // strips `--conditions=source` from `process.env.NODE_OPTIONS` (exactly what
    // `packages/testing/src/jest.setup.js` does, per ward/README.md §5) still hands that same
    // `--conditions=source` to a child spawned with `env` omitted, while an explicit
    // `env: process.env` on the same call correctly sees the stripped value. Plain Node (no Jest)
    // does not have this split at all. `laneBootBroker` already builds this same explicit snapshot
    // for its own spawns; this is that pattern, applied here so the driver — spawned with no other
    // env override — is never the one call site still relying on Node's default.
    const inheritedEnv = Object.fromEntries(
      Object.entries(process.env)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]): [PropertyKey, ContentText] => [key, contentTextContract.parse(value)]),
    );

    childProcessSpawnDetachedAdapter({
      command: process.execPath,
      // `locationsStatics.siegelense.dir` doubles as the CLI subcommand name here — both are the
      // literal string 'siegelense', and `no-bare-location-literals` bans typing it a second time.
      args: [
        driverBinPath,
        locationsStatics.siegelense.dir,
        'driver',
        '--instance',
        reservedEntry.id,
        ...(idleTimeoutMs === undefined ? [] : ['--idle-timeout-ms', String(idleTimeoutMs)]),
      ],
      cwd: absoluteFilePathContract.parse(repoRoot),
      env: inheritedEnv,
      stdoutFd: driverLogFd,
      stderrFd: driverLogFd,
    });

    const socketPath = locationsSocketPathFindBroker({ instanceId: reservedEntry.id });
    const bootStartedAtMs = epochMsContract.parse(Date.now());
    const bootDeadlineMs = epochMsContract.parse(
      bootStartedAtMs + driverStatics.boot.defaultTimeoutMs,
    );

    const pollOutcome = await instanceStartBootPollLayerBroker({
      socketPath,
      deadlineMs: bootDeadlineMs,
      evidencePath,
    });

    if (pollOutcome.status === 'failed') {
      // The driver caught its own error and wrote it beside the evidence before exiting — that
      // report IS the cause, so it is what reaches the caller rather than the generic "never
      // answered its ready path" a bare connection refusal would otherwise read as.
      throw new DriverBootFailedError({
        specName: spec.name,
        instanceId: reservedEntry.id,
        driverMessage: pollOutcome.message,
        driverLogPath,
      });
    }

    if (pollOutcome.status === 'timeout') {
      // The driver's own control socket never answered, which says nothing by itself about
      // WHICH of the spec's processes stalled — a process with no readyPath is never a boot-
      // readiness candidate at all (lane-boot-broker never checks it), and a process that DOES
      // have one may already be answering fine while a sibling hangs. A fresh, immediate probe
      // (`deadlineMs: Date.now()` — one attempt, no further poll wait) against each checkable
      // process's own readyPath is the only way this caller can tell those apart from here; the
      // driver crashing mid-boot kills every spawned process together, in which case every probe
      // below reports unready together too, which is the honest answer for that case.
      const unreadyNames = await Promise.all(
        spec.processes.map(async (laneProcess): Promise<LaneProcessName | null> => {
          const { portRole, readyPath } = laneProcess;
          if (portRole === null || readyPath === null) {
            return null;
          }

          const port = laneProcessPortResolveTransformer({
            portRole,
            ports: reservedEntry.ports,
          });
          if (port === null) {
            // Unreachable in practice — portRole is non-null here, and the transformer only
            // returns null for a null portRole. Satisfies noUncheckedIndexedAccess rather than
            // asserting the value away.
            return null;
          }

          const readyUrl = `http://${environmentStatics.hostname}:${String(port)}${readyPath}`;
          const stillAnswering = await laneReadyWaitBroker({
            url: readyUrl,
            deadlineMs: Date.now(),
          });

          return stillAnswering ? null : laneProcess.name;
        }),
      );

      throw new LaneBootFailedError({
        specName: spec.name,
        instanceId: reservedEntry.id,
        unready: unreadyNames.filter((name): name is LaneProcessName => name !== null),
        logPaths: [driverLogPath],
      });
    }

    const bootEndedAtMs = epochMsContract.parse(Date.now());
    const bootMs = epochMsContract.parse(bootEndedAtMs - bootStartedAtMs);

    // This is the only side that sees a boot begin, so it is the only side that can measure one —
    // `bootMs` is the one figure in a profile that is genuinely measured rather than illustrative
    // (spec line 1483). Caught rather than awaited bare: a profile is a convenience `capacity`
    // reads, and letting its write throw here would land in the catch below and tear down an
    // instance that booted perfectly well.
    await profileBootRecordBroker({
      instanceId: reservedEntry.id,
      specHash,
      bootMs,
    }).catch((error: unknown) => {
      process.stderr.write(
        `instanceStartBroker: recording the boot profile for ${reservedEntry.id} failed, the instance is up regardless: ${String(error)}\n`,
      );
    });

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

    // A browserless spec (spec line 2145: "just another spec") never assigns any process the
    // `web` portRole — nothing binds that half of the claimed pair, so a URL built from it points
    // at a port nothing is listening on. `null` says so directly rather than handing back a URL a
    // caller has to discover is dead by trying it. Resolved through `laneProcessPortResolveTransformer`
    // and compared against the claimed web port, never a bare `=== 'web'` — `portRole` shares its
    // spelling with a package name but decides nothing about one.
    const hasWebSurface = spec.processes.some(
      (laneProcess) =>
        laneProcessPortResolveTransformer({
          portRole: laneProcess.portRole,
          ports: bootedEntry.ports,
        }) === bootedEntry.ports.web,
    );

    // Same reasoning as `hasWebSurface`, for the `api` half of the pair — both built-in specs
    // (`dungeonmaster-stack` and `dungeonmaster-api`) carry the same `API_PROCESS` entry, so this is
    // true for either today, but a future spec with no api process gets an honestly-omitted `apiUrl`
    // rather than a URL built off a port nothing binds.
    const hasApiSurface = spec.processes.some(
      (laneProcess) =>
        laneProcessPortResolveTransformer({
          portRole: laneProcess.portRole,
          ports: bootedEntry.ports,
        }) === bootedEntry.ports.api,
    );

    // `--seed` runs from THIS side rather than down the driver socket: the client half already
    // holds the booted lane's api port and the deterministic home, so building a RecipeContext
    // costs nothing, and routing it through `run` instead would burn a run id and write a
    // transcript entry for something that is not a step.
    //
    // A seed that fails tears the instance down and rethrows, through the same catch every other
    // boot failure takes. A lane whose seed failed is a lane whose state is not what the caller
    // asked for, and handing back a manifest with `seeded: null` would make it indistinguishable
    // from one nobody asked to seed.
    const seeded =
      seed === null
        ? null
        : await recipeSeedRunBroker({
            recipe: seed,
            apiBaseUrl: contentTextContract.parse(
              `http://${environmentStatics.hostname}:${String(bootedEntry.ports.api)}`,
            ),
            homePath,
            parameters: {},
          });

    return instanceManifestContract.parse({
      instanceId: reservedEntry.id,
      specName,
      baseUrl: hasWebSurface
        ? contentTextContract.parse(
            `http://${environmentStatics.hostname}:${String(bootedEntry.ports.web)}`,
          )
        : null,
      // `apiUrl` is `.optional()`, not `.nullable()` (unlike `baseUrl`) — omitted entirely rather
      // than set to `null` when the spec has no api surface, matching exactOptionalPropertyTypes.
      ...(hasApiSurface
        ? {
            apiUrl: contentTextContract.parse(
              `http://${environmentStatics.hostname}:${String(bootedEntry.ports.api)}`,
            ),
          }
        : {}),
      home: homePath,
      evidence: evidenceRepoLocal,
      logs: { api: apiLogRepoLocal, web: webLogRepoLocal },
      // The SEEDED guild, never the partition one — `evidence` above is still filed under the
      // guild that owns `quest` (siegelense-tooling.md line 2328). Keying assets by a seeded id
      // would file every instance under a partition of its own and defeat the point.
      seeded,
      queuedMs,
      aheadOfMe,
      bootMs,
    });
  } catch (bootError) {
    await bootLockReleaseBroker({ instanceId: reservedEntry.id });

    // A reservation `instanceReserveBroker` minted for THIS attempt must not outlive a boot that
    // never happened — an unreleased row stays `state: 'alive'` with `bootedAtMs: null` forever,
    // holding its port pair with no process behind it. Released, never deleted: instanceReleaseBroker's
    // own tombstone rule is what keeps a fixer's later `results` from answering "unknown instance"
    // for evidence already sitting on disk. Wrapped so a throw HERE can never replace `bootError` —
    // the boot failure is what a caller needs to see, whether or not the cleanup after it succeeds.
    try {
      await instanceReleaseBroker({ instanceId: reservedEntry.id });
    } catch (releaseError: unknown) {
      process.stderr.write(
        `instanceStartBroker: releasing the reservation for ${reservedEntry.id} after a failed boot failed: ${String(releaseError)}\n`,
      );
    }

    throw bootError;
  }
};
