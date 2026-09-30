/**
 * PURPOSE: Creates .dungeonmaster.json with full defaults when missing. When it already exists, adds
 * whichever of the devServer.e2e.processes placeholder and the empty `gateway` key the file is missing —
 * preserving every other key and value, and creating devServer when the file has none — unless the file
 * already carries BOTH, is corrupt/unreadable, or fails dungeonmasterConfigContract; those three leave the
 * file byte-for-byte untouched and say why in the result. The two additions are independent: a file that
 * already ran `init` once (and so already has devServer.e2e) still gets `gateway: {}` added on a later
 * `init` if it predates this key, and a file with a hand-added `gateway` key still gets the e2e placeholder
 * if it lacks one. `readJsonFileIfExists` only ever answers `null` for "the file is gone" (ENOENT); a
 * corrupt or permission-denied read THROWS instead, so this responder catches that throw itself rather than
 * folding it into the same `null` a genuinely missing file produces — the two are different facts and get
 * different messages. The placeholder is the literal `e2eProcessPlaceholderStatics.process` value both here
 * and in a later placeholder-detection check, so the two stay in sync by construction.
 *
 * USAGE:
 * const result = await InstallCreateConfigResponder({ context });
 * // action: 'created' (fresh file), 'merged' (the e2e placeholder and/or gateway key added to an existing
 * // file), or 'skipped' (already has both, fails validation, or could not be safely read)
 */

import {
  type InstallContext,
  type InstallResult,
  installResultContract,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics, environmentStatics } from '@dungeonmaster/shared/statics';
import { jsonFileContentsTransformer } from '@dungeonmaster/shared/transformers';
import { join } from '#gateway/node/path';
import { pathExists, readJsonFileIfExists, writeFile } from '#gateway/node/fs__promises';
import { dungeonmasterConfigContract } from '../../../contracts/dungeonmaster-config/dungeonmaster-config-contract';
import { configDefaultsStatics } from '../../../statics/config-defaults/config-defaults-statics';
import { e2eProcessPlaceholderStatics } from '../../../statics/e2e-process-placeholder/e2e-process-placeholder-statics';

const CONFIG_FILENAME = locationsStatics.repoRoot.config;
const PACKAGE_NAME = '@dungeonmaster/config';

export const InstallCreateConfigResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const configPath = join(context.targetProjectRoot, CONFIG_FILENAME);

  const configExists = await pathExists(configPath);

  if (configExists) {
    // Operates on the RAW parsed JSON, never on the zod-parsed result: dungeonmasterConfigContract
    // fills in every omitted optional field's .default(), so writing THAT back would silently add
    // fields (buildCommand, readinessPath, ...) an existing file never had.
    const readResult = await readJsonFileIfExists(configPath).then(
      (value: unknown): { ok: true; value: unknown } => ({ ok: true, value }),
      (error: unknown): { ok: false; error: unknown } => ({ ok: false, error }),
    );

    if (!readResult.ok) {
      const { error } = readResult;
      const isCorruptJson = error instanceof SyntaxError;
      return installResultContract.parse({
        packageName: PACKAGE_NAME,
        success: true,
        action: 'skipped',
        message: isCorruptJson
          ? '.dungeonmaster.json exists but is not valid JSON — left untouched'
          : '.dungeonmaster.json exists but could not be read — left untouched',
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // `pathExists` already confirmed the file was there, so `readResult.value === null` here means
    // it vanished between that check and this read (ENOENT), not corruption — there is nothing
    // existing left to protect, so this falls through to the same "create fresh" path used when
    // `configExists` was false to begin with, rather than being reported as a skip.
    if (readResult.value !== null) {
      const parsedExisting = readResult.value;
      const validatedExisting = dungeonmasterConfigContract.safeParse(parsedExisting);
      if (!validatedExisting.success) {
        return installResultContract.parse({
          packageName: PACKAGE_NAME,
          success: true,
          action: 'skipped',
          message: '.dungeonmaster.json exists but failed config validation — left untouched',
        });
      }

      const hasDevServerE2e = Boolean(validatedExisting.data.devServer?.e2e);
      const hasGateway = Boolean(validatedExisting.data.gateway);

      if (hasDevServerE2e && hasGateway) {
        return installResultContract.parse({
          packageName: PACKAGE_NAME,
          success: true,
          action: 'skipped',
          message: '.dungeonmaster.json already exists',
        });
      }

      const rawConfig = parsedExisting as Record<PropertyKey, unknown>;
      const existingDevServer =
        typeof rawConfig.devServer === 'object' && rawConfig.devServer !== null
          ? (rawConfig.devServer as Record<PropertyKey, unknown>)
          : {};

      const mergedConfig: Record<PropertyKey, unknown> = {
        ...rawConfig,
        ...(hasGateway ? {} : { gateway: {} }),
        devServer: hasDevServerE2e
          ? existingDevServer
          : { ...existingDevServer, e2e: { processes: [e2eProcessPlaceholderStatics.process] } },
      };

      const mergedContents = jsonFileContentsTransformer({ value: mergedConfig });
      await writeFile(configPath, mergedContents);
      return installResultContract.parse({
        packageName: PACKAGE_NAME,
        success: true,
        action: 'merged',
        message:
          !hasDevServerE2e && !hasGateway
            ? 'Added the devServer.e2e.processes placeholder and the gateway key to existing .dungeonmaster.json'
            : hasDevServerE2e
              ? 'Added the gateway key to existing .dungeonmaster.json'
              : 'Added the devServer.e2e.processes placeholder to existing .dungeonmaster.json',
      });
    }
  }

  // Full working default: everything past framework/schema is optional-with-defaults, so
  // seed the load-bearing knobs (ports, orchestration, devServer) rather than a bare stub.
  // Parsing fills the remaining defaults and enforces the port-collision refine at write time.
  const validated = dungeonmasterConfigContract.parse({
    framework: 'monorepo',
    schema: 'zod',
    orchestrationMode: 'node',
    dungeonmaster: { port: environmentStatics.defaultPort },
    orchestration: {},
    gateway: {},
    devServer: {
      devCommand: configDefaultsStatics.devServer.devCommand,
      port: configDefaultsStatics.devServer.port.default,
      e2e: {
        processes: [e2eProcessPlaceholderStatics.process],
      },
    },
  });

  const contents = jsonFileContentsTransformer({ value: validated });
  await writeFile(configPath, contents);
  return installResultContract.parse({
    packageName: PACKAGE_NAME,
    success: true,
    action: 'created',
    message: 'Created .dungeonmaster.json',
  });
};
