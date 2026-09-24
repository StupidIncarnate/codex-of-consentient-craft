/**
 * PURPOSE: Creates .dungeonmaster.json with full defaults when missing. When it already exists, adds the
 * devServer.e2e.processes placeholder in place — preserving every other key and value, and creating devServer
 * when the file has none — unless the file already carries devServer.e2e, does not parse as JSON, or fails
 * dungeonmasterConfigContract; those three leave the file byte-for-byte untouched and say why in the result
 * message. The placeholder is the literal `e2eProcessPlaceholderStatics.process` value both here and in a
 * later placeholder-detection check, so the two stay in sync by construction.
 *
 * USAGE:
 * const result = await InstallCreateConfigResponder({ context });
 * // action: 'created' (fresh file), 'merged' (placeholder added to an existing file),
 * // or 'skipped' (already has devServer.e2e, or the file could not be safely edited)
 */

import {
  type InstallContext,
  type InstallResult,
  installMessageContract,
  packageNameContract,
  fileContentsContract,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics, environmentStatics } from '@dungeonmaster/shared/statics';
import { dungeonmasterConfigContract } from '../../../contracts/dungeonmaster-config/dungeonmaster-config-contract';
import { configDefaultsStatics } from '../../../statics/config-defaults/config-defaults-statics';
import { e2eProcessPlaceholderStatics } from '../../../statics/e2e-process-placeholder/e2e-process-placeholder-statics';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { fsAccessAdapter } from '../../../adapters/fs/access/fs-access-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';

const CONFIG_FILENAME = locationsStatics.repoRoot.config;
const PACKAGE_NAME = '@dungeonmaster/config';
const JSON_INDENT_SPACES = 2;
const F_OK = 0;

export const InstallCreateConfigResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const configPath = pathJoinAdapter({
    paths: [context.targetProjectRoot, CONFIG_FILENAME],
  });

  const configExists = await fsAccessAdapter({ filePath: configPath, mode: F_OK })
    .then(() => true)
    .catch(() => false);

  if (configExists) {
    // Operates on the RAW parsed JSON, never on the zod-parsed result: dungeonmasterConfigContract
    // fills in every omitted optional field's .default(), so writing THAT back would silently add
    // fields (buildCommand, readinessPath, ...) an existing file never had. `null` is a safe "could
    // not read or parse" sentinel — JSON.parse never itself produces it from a successful read of
    // this file, since a valid .dungeonmaster.json is always an object, never the literal `null`.
    const parsedExisting: unknown = await fsReadFileAdapter({ filePath: configPath })
      .then((rawContents) => JSON.parse(rawContents) as unknown)
      .catch(() => null);

    if (parsedExisting === null) {
      return {
        packageName: packageNameContract.parse(PACKAGE_NAME),
        success: true,
        action: 'skipped',
        message: installMessageContract.parse(
          '.dungeonmaster.json exists but is not valid JSON — left untouched',
        ),
      };
    }

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
    await fsWriteFileAdapter({ filepath: configPath, contents: mergedContents });
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'merged',
      message: installMessageContract.parse(
        'Added the devServer.e2e.processes placeholder to existing .dungeonmaster.json',
      ),
    };
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
  await fsWriteFileAdapter({ filepath: configPath, contents });
  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: 'created',
    message: installMessageContract.parse('Created .dungeonmaster.json'),
  };
};
