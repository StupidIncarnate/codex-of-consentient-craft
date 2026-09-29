/**
 * PURPOSE: Handles the `dungeonmaster init` command by running installation across all packages and writing status to stdout
 *
 * USAGE:
 * await CliInitResponder({ context });
 * // Writes [OK] or [FAIL] status lines for each package to stdout
 */

import { stdout } from '#gateway/node/process';
import type { InstallContext } from '@dungeonmaster/shared/contracts';

import { installRunBroker } from '../../../brokers/install/run/install-run-broker';

export const CliInitResponder = async ({ context }: { context: InstallContext }): Promise<void> => {
  const results = await installRunBroker({
    context,
  });

  for (const result of results) {
    const status = result.success ? 'OK' : 'FAIL';
    // message is populated on success, error on failure — never both, and either can be absent,
    // so a bare `result.message` prints the literal string "undefined" on every real failure.
    const detail =
      (result.success ? result.message : result.error) ?? 'no install message reported';
    stdout.write(`[${status}] ${result.packageName}: ${detail}\n`);
  }
};
