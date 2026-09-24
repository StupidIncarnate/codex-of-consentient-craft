/**
 * PURPOSE: Derives a `LaneSpec` from the consumer repo's own `.dungeonmaster.json`
 * (`devServer.e2e.processes`) rather than a closed lookup against two dungeonmaster-shaped
 * built-ins — siegelense boots whatever a repo's own e2e config names, the same way that repo's own
 * Playwright setup boots it. `specName` decides only whether a browser rides along:
 * `laneSpecConventionStatics.browsered` ('stack') boots every configured process with a Chromium
 * session, `laneSpecConventionStatics.headless` ('api') boots the same processes headless. Throws
 * `E2eNotConfiguredError` when `devServer.e2e` is missing, or when every configured process still
 * matches the placeholder `InstallCreateConfigResponder` seeds — an unedited config is not a repo
 * that has opted in yet.
 *
 * USAGE:
 * await laneSpecFindBroker({ specName: SpecNameStub({ value: 'api' }) });
 * // Resolves the browserless LaneSpec built from this repo's own devServer.e2e.processes
 */

import { processCwdAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics, locationsStatics } from '@dungeonmaster/shared/statics';
import { e2eProcessPlaceholderStatics } from '@dungeonmaster/config';

import { dungeonmasterConfigResolveAdapter } from '../../../adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter';
import { laneSpecContract } from '../../../contracts/lane-spec/lane-spec-contract';
import type { LaneSpec } from '../../../contracts/lane-spec/lane-spec-contract';
import type { SpecName } from '../../../contracts/spec-name/spec-name-contract';
import { laneSpecConventionStatics } from '../../../statics/lane-spec-convention/lane-spec-convention-statics';
import { driverStatics } from '../../../statics/driver/driver-statics';
import { E2eNotConfiguredError } from '../../../errors/e2e-not-configured/e2e-not-configured-error';

export const laneSpecFindBroker = async ({
  specName,
}: {
  specName: SpecName;
}): Promise<LaneSpec> => {
  const browser =
    specName === laneSpecConventionStatics.browsered
      ? true
      : specName === laneSpecConventionStatics.headless
        ? false
        : null;

  if (browser === null) {
    throw new Error(
      `Unknown lane spec "${specName}". Known specs: ${laneSpecConventionStatics.browsered}, ${laneSpecConventionStatics.headless}`,
    );
  }

  // The config-find chain dirname()s startPath on its first iteration — it expects a FILE, so hand
  // it the repo-root config file itself (<cwd>/.dungeonmaster.json), NOT the bare cwd directory: a
  // bare directory dirname()s to cwd's PARENT, walking above the repo root and missing the config.
  // Built by template concatenation, never `pathJoinAdapter`: that adapter's own mock is a single
  // call-ordered queue several OTHER proxies in this package already share for their own path
  // joins, and one more consumer of it steals a slot staged for a caller that runs later.
  const startPath = filePathContract.parse(
    `${processCwdAdapter()}/${dungeonmasterHomeStatics.paths.projectConfigFile}`,
  );
  const config = await dungeonmasterConfigResolveAdapter({ startPath });
  const configuredProcesses = config.devServer?.e2e?.processes;

  if (configuredProcesses === undefined) {
    throw new E2eNotConfiguredError({ specName });
  }

  // D1: an unedited placeholder is not a repo that has opted in — compared field by field (env
  // included) against the SAME literal InstallCreateConfigResponder seeds, rather than by identity,
  // since the value crossed a JSON round-trip on disk.
  const placeholder = e2eProcessPlaceholderStatics.process;
  const isUnedited = configuredProcesses.some((entry) => {
    const entryEnvEntries = Object.entries(entry.env ?? {}).map(
      ([key, value]) => [key, String(value)] as const,
    );
    const placeholderEnvEntries = Object.entries(placeholder.env);
    const envMatches =
      entryEnvEntries.length === placeholderEnvEntries.length &&
      placeholderEnvEntries.every(([key, value]) =>
        entryEnvEntries.some(([entryKey, entryValue]) => entryKey === key && entryValue === value),
      );
    return (
      String(entry.name) === placeholder.name &&
      String(entry.command) === placeholder.command &&
      entry.portRole === placeholder.portRole &&
      String(entry.readyPath) === placeholder.readyPath &&
      envMatches
    );
  });

  if (isUnedited) {
    throw new E2eNotConfiguredError({ specName });
  }

  return laneSpecContract.parse({
    name: specName,
    processes: configuredProcesses.map((entry) => ({
      name: String(entry.name),
      // A complete, already-composed shell command (entry.command) is spawned through a shell,
      // exactly like Playwright's own webServer.command — never split into a hand-parsed argv.
      command: 'sh',
      args: ['-c', String(entry.command)],
      portRole: entry.portRole,
      readyPath: String(entry.readyPath),
      // Indexes by portRole rather than branching on the literal role name — see
      // laneProcessPortResolveTransformer's own header for why `no-hardcoded-package-names` reads
      // a bare `=== 'api'` comparison as deciding something ON a package name.
      logFileName: {
        api: locationsStatics.siegelense.apiLog,
        web: locationsStatics.siegelense.webLog,
      }[entry.portRole],
      env:
        entry.env === undefined
          ? {}
          : Object.fromEntries(
              Object.entries(entry.env).map(([key, value]) => [key, String(value)]),
            ),
    })),
    browser,
    bootTimeoutMs: driverStatics.boot.defaultTimeoutMs,
    env: {},
  });
};
