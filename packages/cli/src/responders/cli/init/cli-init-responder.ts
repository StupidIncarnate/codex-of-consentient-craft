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
    // A failure reads `error` first and falls back to `message`: installResultContract lets a
    // failed result carry either, and a package that reports its failure in `message` is still
    // reporting a real cause — printing only `error` dropped that text on the floor.
    const detail =
      (result.success ? result.message : (result.error ?? result.message)) ??
      'failed without reporting why — its installer returned neither an error nor a message';
    stdout.write(`[${status}] ${result.packageName}: ${detail}\n`);
  }
};
