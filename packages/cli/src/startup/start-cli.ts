/**
 * PURPOSE: CLI startup that delegates command routing to the CLI flow with install context
 *
 * USAGE:
 * await StartCli({ command: 'init', args: [], context: { dungeonmasterRoot, targetProjectRoot } });
 * // Delegates to CliFlow for command routing with install context
 */

import type { AdapterResult, InstallContext } from '@dungeonmaster/shared/contracts';

import { CliFlow } from '../flows/cli/cli-flow';

export const StartCli = async ({
  command,
  args,
  context,
}: {
  command: string | undefined;
  args: readonly string[];
  context: InstallContext;
}): Promise<AdapterResult> => CliFlow({ command, args, context });
