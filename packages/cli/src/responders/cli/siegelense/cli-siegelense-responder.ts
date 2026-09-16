/**
 * PURPOSE: `dungeonmaster siegelense`'s whole CLI-side surface — validates the subcommand (`driver`,
 * `status`, `cleanup`, or bare) and `driver`'s own `--instance` flag cheaply, before ever touching
 * the filesystem, then reaches `@dungeonmaster/siegelense/startup`'s `StartSiegelense` through
 * `runtimeDynamicImportAdapter`. Dynamic, never static: a static import would pull Playwright (a peer
 * dependency of that package, needed only to boot a browser lane) into the esbuild bundle that
 * becomes `dist/bin/dungeonmaster.js`, the binary every consumer installs whether or not they ever
 * run one. `SiegelenseFlow` on the other side of that import re-derives every subcommand and
 * `--instance` from `args` itself — this file's own check is a fast, friendly failure for a human at
 * a terminal, not the source of truth for either value.
 *
 * USAGE:
 * await CliSiegelenseResponder({ args: ['driver', '--instance', 'inst_7f3a9c21'] });
 * // Runs the driver process for that instance until it is killed or goes idle
 *
 * await CliSiegelenseResponder({ args: ['status'] });
 * // Prints the machine block, the monitored list, and one line per instance
 *
 * await CliSiegelenseResponder({ args: ['cleanup'] });
 * // Reaps stale instances and prints what was reaped, released, and left alone
 *
 * await CliSiegelenseResponder({ args: [] });
 * // Prints the fleet registry to stdout
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract, filePathContract } from '@dungeonmaster/shared/contracts';
import { runtimeDynamicImportAdapter } from '@dungeonmaster/shared/adapters';

const SIEGELENSE_MODULE_NAME = '@dungeonmaster/siegelense/startup';
const SIEGELENSE_PACKAGE_NAME = '@dungeonmaster/siegelense';
const DRIVER_SUBCOMMAND = 'driver';
const STATUS_SUBCOMMAND = 'status';
const CLEANUP_SUBCOMMAND = 'cleanup';
const INSTANCE_FLAG = '--instance';
const USAGE =
  'Usage: dungeonmaster siegelense [driver --instance <instanceId> | status [--instance <instanceId>] | cleanup]';

export const CliSiegelenseResponder = async ({
  args,
}: {
  args: readonly string[];
}): Promise<AdapterResult> => {
  const [subcommand] = args;
  const isKnownSubcommand =
    subcommand === DRIVER_SUBCOMMAND ||
    subcommand === STATUS_SUBCOMMAND ||
    subcommand === CLEANUP_SUBCOMMAND;

  if (subcommand !== undefined && !isKnownSubcommand) {
    throw new Error(`Unknown siegelense subcommand: ${subcommand}\n\n${USAGE}`);
  }

  if (subcommand === DRIVER_SUBCOMMAND) {
    const flagIndex = args.indexOf(INSTANCE_FLAG);
    const value = flagIndex === -1 ? undefined : args[flagIndex + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new Error(
        `${INSTANCE_FLAG} is required: it cannot be missing, and the value cannot itself start ` +
          `with "--".\n\n${USAGE}`,
      );
    }
  }

  const siegelensePath = filePathContract.parse(require.resolve(SIEGELENSE_MODULE_NAME));

  const siegelenseModule = await runtimeDynamicImportAdapter<{
    StartSiegelense: (params: { args: readonly string[] }) => Promise<AdapterResult>;
  }>({ path: siegelensePath }).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load ${SIEGELENSE_PACKAGE_NAME}: ${message}`, { cause: error });
  });

  const result = await siegelenseModule.StartSiegelense({ args });
  return adapterResultContract.parse(result);
};
