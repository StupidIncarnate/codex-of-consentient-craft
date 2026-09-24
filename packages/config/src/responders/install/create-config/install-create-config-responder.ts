/**
 * PURPOSE: Checks for an existing .dungeonmaster.json config file and creates one with full defaults if missing.
 * The devServer.e2e.processes entry it seeds is the literal `e2eProcessPlaceholderStatics.process` value, so a
 * later reader can detect an unedited placeholder by comparing against that same static.
 *
 * USAGE:
 * const result = await InstallCreateConfigResponder({ context });
 * // Creates .dungeonmaster.json (framework/schema/orchestrationMode/ports/orchestration/devServer/devServer.e2e)
 * // or skips if present
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

  try {
    await fsAccessAdapter({ filePath: configPath, mode: F_OK });
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'skipped',
      message: installMessageContract.parse('.dungeonmaster.json already exists'),
    };
  } catch {
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

    const contents = fileContentsContract.parse(
      JSON.stringify(validated, null, JSON_INDENT_SPACES),
    );
    await fsWriteFileAdapter({ filepath: configPath, contents });
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'created',
      message: installMessageContract.parse('Created .dungeonmaster.json'),
    };
  }
};
