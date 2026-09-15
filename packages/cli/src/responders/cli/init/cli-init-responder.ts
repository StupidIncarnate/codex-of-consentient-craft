/**
 * PURPOSE: Handles the `dungeonmaster init` command by running installation across all packages and writing status to stdout
 *
 * USAGE:
 * await CliInitResponder({ context });
 * // Writes [OK] or [FAIL] status lines for each package to stdout
 */

import type { AdapterResult, InstallContext } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import { installRunBroker } from '../../../brokers/install/run/install-run-broker';

export const CliInitResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<AdapterResult> => {
  const results = await installRunBroker({
    context,
  });

  for (const result of results) {
    const status = result.success ? 'OK' : 'FAIL';
    // message is populated on success, error on failure — never both, and either can be absent,
    // so a bare `result.message` prints the literal string "undefined" on every real failure.
    const detail =
      (result.success ? result.message : result.error) ?? 'no install message reported';
    process.stdout.write(`[${status}] ${result.packageName}: ${detail}\n`);
  }
  return adapterResultContract.parse({ success: true });
};
