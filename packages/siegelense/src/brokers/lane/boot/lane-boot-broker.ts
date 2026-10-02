/**
 * PURPOSE: Stands one claimed `PortPair` up into a live `LaneSession` — mkdir the throwaway home and
 * the evidence dir, open one log fd per process, spawn every `LaneProcess` the spec declares
 * (detached, cwd resolved to the repo root so a worktree boot never silently resolves a sibling
 * checkout's compiled output — see `<dungeonmaster-worktrees>`), wait every process with a
 * `readyPath` against ONE shared deadline, and on any failure SIGKILL every spawned group, close
 * every fd, and remove the throwaway HOME this call mkdir'd — never the evidence directory, whose
 * logs are the only record of why the boot failed — before throwing `LaneBootFailedError`. A
 * successful boot removes nothing: the home belongs to the live `LaneSession` and stays until
 * teardown removes it. `packages/web/test/siege-driver/siege-lane.ts`
 * lines 59–368 is the measured shape this generalises from two hardcoded processes to N declared by
 * `spec.processes`. Takes the port pair as a PARAMETER rather than claiming one itself —
 * `instanceReserveBroker` already claimed it in the registry before anything here binds it — and
 * never acquires the boot lock either; both are the caller's concern.
 *
 * This is also the only place that knows `{claudeQueueDir}`/`{wardQueueDir}`'s real values — both
 * live inside `homePath`, which only this call mints, so they are computed here and handed to the
 * substitution transformers alongside `homePath` itself. siegelense knows nothing about Claude or
 * ward: a caller that wants a lane's api process to talk to a fake CLI names it in that PROCESS'S
 * OWN `env` (D4) — `CLAUDE_CLI_PATH`, a relative path resolved against the repo root the same way
 * every other relative `env` value is (see `laneEnvSubstituteTransformer`'s own header) — rather
 * than through an env var this broker discovers on its own.
 *
 * The session it returns also carries the two halves of a `reset level: 'instance'` restart:
 * `stopProcesses` stops every current group and waits until each has exited, and `startProcesses`
 * respawns from the SAME resolved launches boot used (ports, home, env, args, and the same
 * append-mode log fds), waits for readiness against `spec.bootTimeoutMs`, rewrites `session.pgids`
 * in place and re-stamps the registry row, then throws `LaneRestartFailedError` if any process did
 * not come back. The restart lives here because only this call holds the resolved launches.
 *
 * USAGE:
 * const lane = await laneBootBroker({
 *   spec: LaneSpecStub({ browser: false }),
 *   ports: PortPairStub(),
 *   instanceId: InstanceIdStub(),
 *   homePath: '/tmp/dm-siege-inst_1',
 *   evidencePath: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_1',
 *   repoRoot: '/repo',
 * });
 * // Resolves a LaneSession with browser: null (browserless spec) and every pgid it spawned
 */

import { closeSync, openForAppendSync } from '#gateway/node/fs';
import { join } from '#gateway/node/path';
import { envSnapshot } from '#gateway/node/process';
import { ensureDir, rm } from '#gateway/node/fs__promises';
import { environmentStatics, locationsStatics } from '@dungeonmaster/shared/statics';
import type { SiegeInstance } from '@dungeonmaster/shared/contracts';
import { browserSessionLaunchBroker } from '../../browser-session/launch/browser-session-launch-broker';
import { processKillGroupBroker } from '../../process/kill-group/process-kill-group-broker';
import { processesRestartLayerBroker } from './processes-restart-layer-broker';
import { processesSpawnLayerBroker } from './processes-spawn-layer-broker';
import { processesStopLayerBroker } from './processes-stop-layer-broker';
import { serverLogReaderLayerBroker } from './server-log-reader-layer-broker';
import { laneWorkspaceResolveBroker } from '../workspace-resolve/lane-workspace-resolve-broker';
import { isLaneSpecTokenReferencedGuard } from '../../../guards/is-lane-spec-token-referenced/is-lane-spec-token-referenced-guard';
import { laneEnvSubstituteTransformer } from '../../../transformers/lane-env-substitute/lane-env-substitute-transformer';
import { laneProcessPortResolveTransformer } from '../../../transformers/lane-process-port-resolve/lane-process-port-resolve-transformer';
import { lanePlaceholderSubstituteTransformer } from '../../../transformers/lane-placeholder-substitute/lane-placeholder-substitute-transformer';
import { laneSessionContract } from '../../../contracts/lane-session/lane-session-contract';
import { laneLaunchContract } from '../../../contracts/lane-launch/lane-launch-contract';
import type { LaneLaunch } from '../../../contracts/lane-launch/lane-launch-contract';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { laneSpecContract } from '../../../contracts/lane-spec/lane-spec-contract';
import type { LaneSpec } from '../../../contracts/lane-spec/lane-spec-contract';
import type { PortPair } from '../../../contracts/port-pair/port-pair-contract';
import { LaneBootFailedError } from '../../../errors/lane-boot-failed/lane-boot-failed-error';

export const laneBootBroker = async ({
  spec,
  ports,
  instanceId,
  homePath,
  evidencePath,
  repoRoot,
}: {
  spec: LaneSpec;
  ports: PortPair;
  instanceId: SiegeInstance['id'];
  homePath: string;
  evidencePath: string;
  repoRoot: string;
}): Promise<LaneSession> => {
  // process.env is inherited by every spawned process; the spec's own env (and each process's
  // further override) is merged OVER it — see LaneSpec's PURPOSE. `[string, string]`
  // on the map callback (not a plain array literal) is what makes `Object.fromEntries` select its
  // typed overload instead of its untyped `any`-returning one. A value already known
  // non-undefined at runtime passes through with no type predicate, and a genuinely undefined one
  // is filtered out first.
  const inheritedEnv: Record<string, string> = Object.fromEntries(
    Object.entries(envSnapshot()).flatMap(([key, value]): [string, string][] =>
      value === undefined ? [] : [[key, value]],
    ),
  );

  const spawnCwd = repoRoot;

  await Promise.all([ensureDir(homePath), ensureDir(evidencePath)]);

  // Per-instance, and known nowhere else: both live inside homePath, which only this call mints.
  const claudeQueueDir = join(homePath, locationsStatics.siegelense.claudeQueueDir);
  const wardQueueDir = join(homePath, locationsStatics.siegelense.wardQueueDir);

  // `{apiWorkspace}`/`{webWorkspace}` name a package by ROLE rather than by literal name — see
  // lane-spec-statics.ts's header. Resolved only when some process actually references the token:
  // a repo that never built an http-backend or frontend-react package must still be able to boot a
  // spec that never asked for one, and `laneWorkspaceResolveBroker` throws when its kind resolves to
  // none or to more than one package under `packages/`.
  const [resolvedApiWorkspace, resolvedWebWorkspace] = await Promise.all([
    isLaneSpecTokenReferencedGuard({ spec, token: '{apiWorkspace}' })
      ? laneWorkspaceResolveBroker({
          repoRoot: spawnCwd,
          packageType: 'http-backend',
        })
      : Promise.resolve(undefined),
    isLaneSpecTokenReferencedGuard({ spec, token: '{webWorkspace}' })
      ? laneWorkspaceResolveBroker({
          repoRoot: spawnCwd,
          packageType: 'frontend-react',
        })
      : Promise.resolve(undefined),
  ]);
  const apiWorkspace = resolvedApiWorkspace ?? '';
  const webWorkspace = resolvedWebWorkspace ?? '';

  const substitutedSpecEnv = laneEnvSubstituteTransformer({
    env: spec.env,
    ports,
    home: homePath,
    claudeQueueDir,
    wardQueueDir,
    apiWorkspace,
    webWorkspace,
    repoRoot: spawnCwd,
  });

  const launches: readonly LaneLaunch[] = spec.processes.map((laneProcess) => {
    const logPath = join(evidencePath, laneProcess.logFileName);
    const fd = openForAppendSync(logPath);

    const substitutedArgs = laneProcess.args.map((arg) =>
      lanePlaceholderSubstituteTransformer({
        template: arg,
        ports,
        home: homePath,
        claudeQueueDir,
        wardQueueDir,
        apiWorkspace,
        webWorkspace,
      }),
    );
    const substitutedProcessEnv = laneEnvSubstituteTransformer({
      env: laneSpecContract.shape.env.parse(laneProcess.env),
      ports,
      home: homePath,
      claudeQueueDir,
      wardQueueDir,
      apiWorkspace,
      webWorkspace,
      repoRoot: spawnCwd,
    });
    // A value still carrying a `{token}` after substitution is one this design has no honest answer
    // for — today that never happens for the two built-in specs (every token they declare resolves
    // above), but a custom spec is free to write a token nothing here knows. Such a value must never
    // win the merge: it reads as plausible right up until the spawned process tries to use it, which
    // is strictly worse than falling back to whatever the caller's own environment already supplied
    // for that key. Filtering it out of EACH template before the merge — rather than reordering the
    // spread — is what lets a genuinely resolved value (DUNGEONMASTER_HOME, the ports, …) keep
    // overriding the caller's ambient env exactly as a sandboxed lane needs to: two lanes sharing a
    // terminal must not silently share a home directory merely because the caller's shell happened
    // to export DUNGEONMASTER_HOME first.
    const mergedEnv = {
      ...inheritedEnv,
      ...Object.fromEntries(
        Object.entries(substitutedSpecEnv).filter(([, value]) => !value.includes('{')),
      ),
      ...Object.fromEntries(
        Object.entries(substitutedProcessEnv).filter(([, value]) => !value.includes('{')),
      ),
    };

    const port = laneProcessPortResolveTransformer({ portRole: laneProcess.portRole, ports });
    const readyUrl =
      laneProcess.readyPath === null || port === null
        ? null
        : `http://${environmentStatics.hostname}:${String(port)}${lanePlaceholderSubstituteTransformer(
            {
              template: laneProcess.readyPath,
              ports,
              home: homePath,
              claudeQueueDir,
              wardQueueDir,
              apiWorkspace,
              webWorkspace,
            },
          )}`;

    return laneLaunchContract.parse({
      name: laneProcess.name,
      command: laneProcess.command,
      args: substitutedArgs,
      env: mergedEnv,
      logPath,
      fd,
      readyUrl,
    });
  });

  const booted = await processesSpawnLayerBroker({
    launches,
    cwd: spawnCwd,
    bootTimeoutMs: spec.bootTimeoutMs,
  });

  if (booted.unready.length > 0) {
    booted.pgids.forEach((pgid) => {
      processKillGroupBroker({ pgid, signal: 'SIGKILL' });
    });
    launches.forEach((launch) => {
      closeSync(launch.fd);
    });
    // homePath only — never evidencePath. Evidence (the logs `unready` names) is the one record of
    // why this boot failed, and outlives the instance; see packages/siegelense/CLAUDE.md.
    await rm(homePath, { recursive: true, force: true });

    throw new LaneBootFailedError({
      specName: spec.name,
      instanceId,
      unready: booted.unready.map((launch) => launch.name),
      logPaths: booted.unready.map((launch) => launch.logPath),
    });
  }

  const webBaseUrl = `http://${environmentStatics.hostname}:${String(ports.web)}`;
  const browser = spec.browser
    ? await browserSessionLaunchBroker({ baseUrl: webBaseUrl, evidencePath })
    : null;

  // laneSpecContract refines on `processes.length > 0`, so this is always populated — the check is
  // only here to satisfy noUncheckedIndexedAccess, never a real "empty spec" path.
  const [firstLaunch] = launches;
  if (firstLaunch === undefined) {
    throw new Error(
      `Spec ${spec.name} declares no processes to boot — add at least one process to it before ` +
        `starting an instance.`,
    );
  }
  // Every log fd is opened in append mode and reused by a restart's respawn, so a restarted process
  // writes after its predecessor's last byte and every offset this reader handed out stays valid.
  const { readServerLogSince, serverLogLength } = serverLogReaderLayerBroker({
    logPath: firstLaunch.logPath,
  });

  // The ONE array `session.pgids` points at for the lane's whole life. A restart rewrites its
  // contents in place, so teardown, the heartbeat ticker and anything else holding this session
  // read the groups that are running NOW — never the ones a restart killed.
  const livePgids = [...laneSessionContract.shape.pgids.parse(booted.pgids)];
  const apiBaseUrl = `http://${environmentStatics.hostname}:${String(ports.api)}`;

  // `pgids` is the live array itself, not the parse's copy: a restart rewrites it in place and every
  // holder of the session must read the groups running now.
  return {
    ...laneSessionContract.parse({
      specName: spec.name,
      ports,
      homePath,
      evidencePath,
      repoRoot,
      baseUrl: apiBaseUrl,
      apiBaseUrl,
      pgids: livePgids,
      browser,
      logFds: launches.map((launch) => launch.fd),
    }),
    pgids: livePgids,
    readServerLogSince,
    serverLogLength,
    stopProcesses: async (): Promise<void> => processesStopLayerBroker({ pgids: livePgids }),
    startProcesses: async (): Promise<void> => {
      await processesRestartLayerBroker({
        launches,
        cwd: spawnCwd,
        bootTimeoutMs: spec.bootTimeoutMs,
        instanceId,
        specName: spec.name,
        livePgids,
      });
    },
  };
};
