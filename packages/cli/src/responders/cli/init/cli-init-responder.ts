/**
 * PURPOSE: Handles the `dungeonmaster init` command by running installation across all packages and writing status to stdout
 *
 * USAGE:
 * await CliInitResponder({ context });
 * // Writes [OK] or [FAIL] status lines for each package to stdout
 */

import type { InstallContext } from '@dungeonmaster/shared/contracts';

import { installRunBroker } from '../../../brokers/install/run/install-run-broker';

export const CliInitResponder = async ({ context }: { context: InstallContext }): Promise<void> => {
  const results = await installRunBroker({
    context,
  });

  for (const result of results) {
    const status = result.success ? 'OK' : 'FAIL';
    process.stdout.write(`[${status}] ${result.packageName}: ${result.message}\n`);
  }
};
