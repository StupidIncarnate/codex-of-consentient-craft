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
 * substitution transformers alongside `homePath` itself. `CLAUDE_CLI_PATH`/`WARD_CLI_PATH` are NOT
 * among the tokens substituted here: the real fake-CLI binaries they would need to name live under
 * `packages/web/test/**` and `packages/orchestrator/test-fixtures/**`, neither shipped in this
 * package's published `dist/` nor a path any resolver this broker has access to can honestly build —
 * see `lane-spec-statics.ts`'s header. A caller that wants a lane to exercise a fake CLI sets
 * `CLAUDE_CLI_PATH`/`WARD_CLI_PATH` in its OWN environment before invoking siegelense, and the merge
 * below is what lets that survive. When `spec.requiresFakeAgentCli` is true and the caller supplied
 * neither, this call checks for committed in-repo fixtures on disk, populating them into the
 * inherited environment if found, and throws `FakeAgentCliRequiredError` before any mkdir or spawn
 * happens only when a variable is not provided and its fixture file is not found on disk — see
 * `fake-agent-cli-statics.ts`'s header for why that outcome is unacceptable to leave live.
 *
 * USAGE:
 * const lane = await laneBootBroker({
 *   spec: LaneSpecStub({ browser: false }),
 *   ports: PortPairStub(),
 *   instanceId: InstanceIdStub(),
 *   homePath: AbsoluteFilePathStub({ value: '/tmp/dm-siege-inst_1' }),
 *   evidencePath: AbsoluteFilePathStub({ value: '/repo/.siegelense/unowned/instances/inst_1' }),
 * });
 * // Resolves a LaneSession with browser: null (browserless spec) and every pgid it spawned
 */

import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import { fsMkdirAdapter, pathJoinAdapter, processCwdAdapter } from '@dungeonmaster/shared/adapters';
import { environmentStatics, locationsStatics } from '@dungeonmaster/shared/statics';
import {
  absoluteFilePathContract,
  contentTextContract,
  filePathContract,
  packageTypeContract,
} from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnDetachedAdapter } from '../../../adapters/child-process/spawn-detached/child-process-spawn-detached-adapter';
import { fsCloseFdAdapter } from '../../../adapters/fs/close-fd/fs-close-fd-adapter';
import { fsOpenFdAdapter } from '../../../adapters/fs/open-fd/fs-open-fd-adapter';
import { fsRmAdapter } from '../../../adapters/fs/rm/fs-rm-adapter';
import { fsStatAdapter } from '../../../adapters/fs/stat/fs-stat-adapter';
import { playwrightSessionAdapter } from '../../../adapters/playwright/session/playwright-session-adapter';
import { processKillGroupAdapter } from '../../../adapters/process/kill-group/process-kill-group-adapter';
import { serverLogReaderLayerBroker } from './server-log-reader-layer-broker';
import { laneReadyWaitBroker } from '../ready-wait/lane-ready-wait-broker';
import { laneWorkspaceResolveBroker } from '../workspace-resolve/lane-workspace-resolve-broker';
import { isLaneSpecTokenReferencedGuard } from '../../../guards/is-lane-spec-token-referenced/is-lane-spec-token-referenced-guard';
import { laneEnvSubstituteTransformer } from '../../../transformers/lane-env-substitute/lane-env-substitute-transformer';
import { laneProcessPortResolveTransformer } from '../../../transformers/lane-process-port-resolve/lane-process-port-resolve-transformer';
import { lanePlaceholderSubstituteTransformer } from '../../../transformers/lane-placeholder-substitute/lane-placeholder-substitute-transformer';
import { fakeAgentCliStatics } from '../../../statics/fake-agent-cli/fake-agent-cli-statics';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import type { LaneSpec } from '../../../contracts/lane-spec/lane-spec-contract';
import type { PortPair } from '../../../contracts/port-pair/port-pair-contract';
import { FakeAgentCliRequiredError } from '../../../errors/fake-agent-cli-required/fake-agent-cli-required-error';
import { LaneBootFailedError } from '../../../errors/lane-boot-failed/lane-boot-failed-error';

export const laneBootBroker = async ({
  spec,
  ports,
  instanceId,
  homePath,
  evidencePath,
}: {
  spec: LaneSpec;
  ports: PortPair;
  instanceId: InstanceId;
  homePath: AbsoluteFilePath;
  evidencePath: AbsoluteFilePath;
}): Promise<LaneSession> => {
  // process.env is inherited by every spawned process; the spec's own env (and each process's
  // further override) is merged OVER it — see LaneSpec's PURPOSE. `[PropertyKey, ContentText]`
  // on the map callback (not a plain array literal) is what makes `Object.fromEntries` select its
  // typed overload instead of its untyped `any`-returning one; `contentTextContract.parse` accepts
  // `unknown` so a value already known non-undefined at runtime passes through with no type
  // predicate, and a genuinely undefined one is filtered out first. Computed before any side
  // effect below so the `requiresFakeAgentCli` check can refuse before mkdir or spawn ever runs.
  const inheritedEnv: Record<PropertyKey, ContentText> = Object.fromEntries(
    Object.entries(process.env)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]): [PropertyKey, ContentText] => [key, contentTextContract.parse(value)]),
  );

  const cwdSeed = processCwdAdapter();
  const repoRoot = await cwdResolveBroker({ startPath: cwdSeed, kind: 'repo-root' });
  const spawnCwd = absoluteFilePathContract.parse(repoRoot);

  // A spec whose processes would otherwise talk to the REAL claude/dungeonmaster-ward binaries
  // must say so declaratively (LaneSpec's PURPOSE) — this is where that declaration is honored.
  // When requiresFakeAgentCli is true and an environment variable is not explicitly provided, this
  // checks whether committed fixture binaries exist on disk in the repository and populates them.
  // Refusing here when neither the env var nor the fixture is found, before any mkdir or spawn,
  // is what keeps a caller who forgot the env from paying for a real agent run and getting a
  // non-deterministic reading back for it.
  if (spec.requiresFakeAgentCli) {
    const checks = await Promise.all(
      fakeAgentCliStatics.requiredEnvVars.map(async (required) => {
        if (inheritedEnv[required.name] !== undefined) {
          return null;
        }
        const fixturePath = absoluteFilePathContract.parse(
          pathJoinAdapter({ paths: [repoRoot, required.fixtureRelativePath] }),
        );
        const fileStat = await fsStatAdapter({ filePath: fixturePath });
        if (fileStat !== null) {
          return { name: required.name, path: contentTextContract.parse(fixturePath) };
        }
        return required;
      }),
    );
    const missing: (
      | (typeof fakeAgentCliStatics.requiredEnvVars)[0]
      | (typeof fakeAgentCliStatics.requiredEnvVars)[1]
    )[] = [];
    checks.forEach((entry) => {
      if (entry === null) {
        return;
      }
      if ('path' in entry) {
        inheritedEnv[entry.name] = entry.path;
        return;
      }
      missing.push(entry);
    });
    if (missing.length > 0) {
      throw new FakeAgentCliRequiredError({ specName: spec.name, missing: [...missing] });
    }
  }

  await Promise.all([
    fsMkdirAdapter({ filepath: filePathContract.parse(homePath) }),
    fsMkdirAdapter({ filepath: filePathContract.parse(evidencePath) }),
  ]);

  // Per-instance, and known nowhere else: both live inside homePath, which only this call mints.
  const claudeQueueDir = absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [homePath, locationsStatics.siegelense.claudeQueueDir] }),
  );
  const wardQueueDir = absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [homePath, locationsStatics.siegelense.wardQueueDir] }),
  );

  // `{apiWorkspace}`/`{webWorkspace}` name a package by ROLE rather than by literal name — see
  // lane-spec-statics.ts's header. Resolved only when some process actually references the token:
  // a repo that never built an http-backend or frontend-react package must still be able to boot a
  // spec that never asked for one, and `laneWorkspaceResolveBroker` throws when its kind resolves to
  // none or to more than one package under `packages/`.
  const [resolvedApiWorkspace, resolvedWebWorkspace] = await Promise.all([
    isLaneSpecTokenReferencedGuard({ spec, token: '{apiWorkspace}' })
      ? laneWorkspaceResolveBroker({
          repoRoot: spawnCwd,
          packageType: packageTypeContract.parse('http-backend'),
        })
      : Promise.resolve(undefined),
    isLaneSpecTokenReferencedGuard({ spec, token: '{webWorkspace}' })
      ? laneWorkspaceResolveBroker({
          repoRoot: spawnCwd,
          packageType: packageTypeContract.parse('frontend-react'),
        })
      : Promise.resolve(undefined),
  ]);
  const apiWorkspace = contentTextContract.parse(resolvedApiWorkspace ?? '');
  const webWorkspace = contentTextContract.parse(resolvedWebWorkspace ?? '');

  const substitutedSpecEnv = laneEnvSubstituteTransformer({
    env: spec.env,
    ports,
    home: homePath,
    claudeQueueDir,
    wardQueueDir,
    apiWorkspace,
    webWorkspace,
  });

  const booted = spec.processes.map((laneProcess) => {
    const logPath = absoluteFilePathContract.parse(
      pathJoinAdapter({ paths: [evidencePath, laneProcess.logFileName] }),
    );
    const fd = fsOpenFdAdapter({ filePath: logPath });

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
      env: laneProcess.env,
      ports,
      home: homePath,
      claudeQueueDir,
      wardQueueDir,
      apiWorkspace,
      webWorkspace,
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

    const { pid, pgid } = childProcessSpawnDetachedAdapter({
      command: laneProcess.command,
      args: substitutedArgs,
      cwd: spawnCwd,
      env: mergedEnv,
      stdoutFd: fd,
      stderrFd: fd,
    });

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

    return { name: laneProcess.name, fd, pid, pgid, logPath, readyUrl };
  });

  const deadlineMs = Date.now() + spec.bootTimeoutMs;

  const readiness = await Promise.all(
    booted.map(async (entry) =>
      entry.readyUrl === null ? true : laneReadyWaitBroker({ url: entry.readyUrl, deadlineMs }),
    ),
  );

  const unready = booted.filter((_entry, index) => readiness[index] !== true);

  if (unready.length > 0) {
    booted.forEach((entry) => {
      processKillGroupAdapter({ pgid: entry.pgid, signal: 'SIGKILL' });
    });
    booted.forEach((entry) => {
      fsCloseFdAdapter({ fd: entry.fd });
    });
    // homePath only — never evidencePath. Evidence (the logs `unready` names) is the one record of
    // why this boot failed, and outlives the instance; see packages/siegelense/CLAUDE.md.
    await fsRmAdapter({ dirPath: homePath });

    throw new LaneBootFailedError({
      specName: spec.name,
      instanceId,
      unready: unready.map((entry) => entry.name),
      logPaths: unready.map((entry) => entry.logPath),
    });
  }

  const webBaseUrl = `http://${environmentStatics.hostname}:${String(ports.web)}`;
  const browser = spec.browser
    ? await playwrightSessionAdapter({ baseUrl: webBaseUrl, evidencePath })
    : null;

  // laneSpecContract refines on `processes.length > 0`, so this is always populated — the check is
  // only here to satisfy noUncheckedIndexedAccess, never a real "empty spec" path.
  const [firstProcess] = booted;
  if (firstProcess === undefined) {
    throw new Error(`laneBootBroker: spec ${spec.name} declared no processes`);
  }
  const { readServerLogSince, serverLogLength } = serverLogReaderLayerBroker({
    logPath: firstProcess.logPath,
  });

  return {
    specName: spec.name,
    ports,
    homePath,
    evidencePath,
    baseUrl: contentTextContract.parse(
      `http://${environmentStatics.hostname}:${String(ports.api)}`,
    ),
    apiBaseUrl: contentTextContract.parse(
      `http://${environmentStatics.hostname}:${String(ports.api)}`,
    ),
    pgids: booted.map((entry) => entry.pgid),
    browser,
    logFds: booted.map((entry) => entry.fd),
    readServerLogSince,
    serverLogLength,
  };
};
