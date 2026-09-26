/**
 * PURPOSE: Creates .dungeonmaster.json with full defaults when missing. When it already exists, adds the
 * devServer.e2e.processes placeholder in place — preserving every other key and value, and creating devServer
 * when the file has none — unless the file already carries devServer.e2e, is corrupt/unreadable, or fails
 * dungeonmasterConfigContract; those three leave the file byte-for-byte untouched and say why in the result.
 * `readJsonFileIfExists` only ever answers `null` for "the file is gone" (ENOENT); a corrupt or permission-denied
 * read THROWS instead, so this responder catches that throw itself rather than folding it into the same `null`
 * a genuinely missing file produces — the two are different facts and get different messages. The placeholder
 * is the literal `e2eProcessPlaceholderStatics.process` value both here and in a later placeholder-detection
 * check, so the two stay in sync by construction.
 *
 * USAGE:
 * const result = await InstallCreateConfigResponder({ context });
 * // action: 'created' (fresh file), 'merged' (placeholder added to an existing file),
 * // or 'skipped' (already has devServer.e2e, fails validation, or could not be safely read)
 */

import {
  type InstallContext,
  type InstallResult,
  installMessageContract,
  packageNameContract,
  fileContentsContract,
  errorMessageContract,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics, environmentStatics } from '@dungeonmaster/shared/statics';
import { join } from '#gateway/node/path';
import { pathExists, readJsonFileIfExists, writeFile } from '#gateway/node/fs/promises';
import { dungeonmasterConfigContract } from '../../../contracts/dungeonmaster-config/dungeonmaster-config-contract';
import { configDefaultsStatics } from '../../../statics/config-defaults/config-defaults-statics';
import { e2eProcessPlaceholderStatics } from '../../../statics/e2e-process-placeholder/e2e-process-placeholder-statics';

const CONFIG_FILENAME = locationsStatics.repoRoot.config;
const PACKAGE_NAME = '@dungeonmaster/config';
const JSON_INDENT_SPACES = 2;

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
      return {
        packageName: packageNameContract.parse(PACKAGE_NAME),
        success: true,
        action: 'skipped',
        message: installMessageContract.parse(
          isCorruptJson
            ? '.dungeonmaster.json exists but is not valid JSON — left untouched'
            : '.dungeonmaster.json exists but could not be read — left untouched',
        ),
        error: errorMessageContract.parse(error instanceof Error ? error.message : String(error)),
      };
    }

    // `pathExists` already confirmed the file was there, so `readResult.value === null` here means
    // it vanished between that check and this read (ENOENT), not corruption — there is nothing
    // existing left to protect, so this falls through to the same "create fresh" path used when
    // `configExists` was false to begin with, rather than being reported as a skip.
    if (readResult.value !== null) {
      const parsedExisting = readResult.value;
      const validatedExisting = dungeonmasterConfigContract.safeParse(parsedExisting);
      if (!validatedExisting.success) {
        return {
          packageName: packageNameContract.parse(PACKAGE_NAME),
          success: true,
          action: 'skipped',
          message: installMessageContract.parse(
            '.dungeonmaster.json exists but failed config validation — left untouched',
          ),
        };
      }

      if (validatedExisting.data.devServer?.e2e) {
        return {
          packageName: packageNameContract.parse(PACKAGE_NAME),
          success: true,
          action: 'skipped',
          message: installMessageContract.parse('.dungeonmaster.json already exists'),
        };
      }

      const rawConfig = parsedExisting as Record<PropertyKey, unknown>;
      const existingDevServer =
        typeof rawConfig.devServer === 'object' && rawConfig.devServer !== null
          ? (rawConfig.devServer as Record<PropertyKey, unknown>)
          : {};

      const mergedConfig: Record<PropertyKey, unknown> = {
        ...rawConfig,
        devServer: {
          ...existingDevServer,
          e2e: { processes: [e2eProcessPlaceholderStatics.process] },
        },
      };

      const mergedContents = fileContentsContract.parse(
        JSON.stringify(mergedConfig, null, JSON_INDENT_SPACES),
      );
      await writeFile(configPath, mergedContents);
      return {
        packageName: packageNameContract.parse(PACKAGE_NAME),
        success: true,
        action: 'merged',
        message: installMessageContract.parse(
          'Added the devServer.e2e.processes placeholder to existing .dungeonmaster.json',
        ),
      };
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
    devServer: {
      devCommand: configDefaultsStatics.devServer.devCommand,
      port: configDefaultsStatics.devServer.port.default,
      e2e: {
        processes: [e2eProcessPlaceholderStatics.process],
      },
    },
  });

  const contents = fileContentsContract.parse(JSON.stringify(validated, null, JSON_INDENT_SPACES));
  await writeFile(configPath, contents);
  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: 'created',
    message: installMessageContract.parse('Created .dungeonmaster.json'),
  };
};
