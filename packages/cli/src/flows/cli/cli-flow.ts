/**
 * PURPOSE: Routes CLI commands to the appropriate responder with install context
 *
 * USAGE:
 * await CliFlow({ command: 'init', context });
 * // Delegates to CliInitResponder for init, CliServeResponder otherwise
 */

import type { AdapterResult, InstallContext } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import { CliInitResponder } from '../../responders/cli/init/cli-init-responder';
import { CliServeResponder } from '../../responders/cli/serve/cli-serve-responder';
import { CliStatuslineTapResponder } from '../../responders/cli/statusline-tap/cli-statusline-tap-responder';

const COMMANDS = {
  init: 'init',
  start: 'start',
  statuslineTap: 'statusline-tap',
} as const;

export const CliFlow = async ({
  command,
  context,
}: {
  command: string | undefined;
  context: InstallContext;
}): Promise<AdapterResult> => {
  if (command === COMMANDS.init) {
    await CliInitResponder({ context });
    return adapterResultContract.parse({ success: true });
  }

  if (command === COMMANDS.statuslineTap) {
    await CliStatuslineTapResponder();
    return adapterResultContract.parse({ success: true });
  }

  await CliServeResponder();
  return adapterResultContract.parse({ success: true });
};
