/**
 * PURPOSE: Forwards `dungeonmaster siegelense`'s argv verbatim to
 * `@dungeonmaster/siegelense/startup`'s `StartSiegelense`, reached through
 * `runtimeDynamicImportAdapter`. Dynamic, never static: a static import would pull Playwright (a
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

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract, filePathContract } from '@dungeonmaster/shared/contracts';
import { runtimeDynamicImportAdapter } from '@dungeonmaster/shared/adapters';

const SIEGELENSE_MODULE_NAME = '@dungeonmaster/siegelense/startup';
const SIEGELENSE_PACKAGE_NAME = '@dungeonmaster/siegelense';

export const CliSiegelenseResponder = async ({
  args,
}: {
  args: readonly string[];
}): Promise<AdapterResult> => {
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
