/**
 * PURPOSE: Forwards `dungeonmaster siegelense`'s argv verbatim to
 * `@dungeonmaster/siegelense/startup`'s `StartSiegelense`, reached through
 * `dynamicImport`. Dynamic, never static: a static import would pull Playwright (a
 * peer dependency of that package, needed only to boot a browser lane) into the esbuild bundle
 * that becomes `dist/bin/dungeonmaster.js`, the binary every consumer installs whether or not they
 * ever run one. This layer validates nothing — no subcommand allow-list, no flag pre-check —
 * because `SiegelenseFlow` on the other side of the import is the single source of truth for which
 * subcommand exists and what its flags are. A second copy of that list here is exactly what made
 * `status` and `cleanup` ship fully built and fully tested, yet untypeable: this file refused both
 * before the import that would have reached them ever ran. The cost of forwarding unconditionally
 * is that an unrecognised subcommand now pays one dynamic import before `SiegelenseFlow` refuses
 * it — microseconds, against a class of bug that has already cost two shipped subcommands.
 *
 * USAGE:
 * await CliSiegelenseResponder({ args: ['status', '--instance', 'inst_7f3a9c21'] });
 * // Forwards verbatim; StartSiegelense prints that instance's status block
 *
 * await CliSiegelenseResponder({ args: [] });
 * // Forwards an empty array; StartSiegelense prints the fleet registry to stdout
 */

import { dynamicImport } from '#gateway/node/module';
import { cwd } from '#gateway/node/process';
import { moduleResolveBroker } from '@dungeonmaster/shared/brokers';
import { siegelenseModuleContract } from '../../../contracts/siegelense-module/siegelense-module-contract';

const SIEGELENSE_MODULE_NAME = '@dungeonmaster/siegelense/startup';
const SIEGELENSE_PACKAGE_NAME = '@dungeonmaster/siegelense';

export const CliSiegelenseResponder = async ({
  args,
}: {
  args: readonly string[];
}): Promise<void> => {
  // Resolved from the user's cwd, so a run inside a worktree loads that worktree's siegelense.
  const { path: siegelensePath } = moduleResolveBroker({
    specifier: SIEGELENSE_MODULE_NAME,
    repoRoot: cwd(),
  });

  const siegelenseModule = siegelenseModuleContract.parse(
    await dynamicImport({ path: siegelensePath }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load ${SIEGELENSE_PACKAGE_NAME}: ${message}`, { cause: error });
    }),
  );

  await siegelenseModule.StartSiegelense({ args });
};
