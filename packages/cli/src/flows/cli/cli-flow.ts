/**
 * PURPOSE: Routes CLI commands to the appropriate responder with install context
 *
 * USAGE:
 * await CliFlow({ command: 'init', context });
 * // Delegates to CliInitResponder for init, CliServeResponder otherwise
 */

import type { AdapterResult, InstallContext } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import { CliCreatePackageResponder } from '../../responders/cli/create-package/cli-create-package-responder';
import { CliInitResponder } from '../../responders/cli/init/cli-init-responder';
import { CliServeResponder } from '../../responders/cli/serve/cli-serve-responder';
import { CliSiegelenseResponder } from '../../responders/cli/siegelense/cli-siegelense-responder';
import { CliStatuslineTapResponder } from '../../responders/cli/statusline-tap/cli-statusline-tap-responder';

const COMMANDS = {
  init: 'init',
  start: 'start',
  statuslineTap: 'statusline-tap',
  createPackage: 'create-package',
  siegelense: 'siegelense',
} as const;

export const CliFlow = async ({
  command,
  args,
  context,
}: {
  command: string | undefined;
  args: readonly string[];
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

  if (command === COMMANDS.createPackage) {
    return CliCreatePackageResponder({ context, args });
  }

  if (command === COMMANDS.siegelense) {
    return CliSiegelenseResponder({ args });
  }

  // Serving is what NO command means, and what `start` names explicitly. Every other unrecognized
  // word is a command this CLI does not have, and it has to say so. Falling through to the server
  // instead boots an HTTP listener on `dungeonmaster.port` for a typo: the first attempt looks
  // like it worked, and a second one dies on `EADDRINUSE: address already in use ::1:4800` — a
  // stack trace about a port, for a caller whose actual mistake was two transposed letters in a
  // subcommand name. `start` is routed here by name rather than left to the fallthrough, so the
  // command it names and the command it runs stay the same thing.
  if (command === undefined || command === COMMANDS.start) {
    await CliServeResponder();
    return adapterResultContract.parse({ success: true });
  }

  throw new Error(`Unknown command: ${command}. Commands: ${Object.values(COMMANDS).join(', ')}.`);
};
