/**
 * PURPOSE: Routes ward CLI subcommands to the appropriate responder
 *
 * USAGE:
 * await WardFlow({ args: ['node', 'ward', 'run'], rootPath: AbsoluteFilePathStub() });
 * // Delegates to WardRunResponder, WardListResponder, WardDetailResponder, or WardRawResponder
 */

import {
  adapterResultContract,
  type AbsoluteFilePath,
  type AdapterResult,
} from '@dungeonmaster/shared/contracts';
import { wardExitCodeStatics } from '@dungeonmaster/shared/statics';

import { WardRunResponder } from '../../responders/ward/run/ward-run-responder';
import { WardListResponder } from '../../responders/ward/list/ward-list-responder';
import { WardDetailResponder } from '../../responders/ward/detail/ward-detail-responder';
import { WardRawResponder } from '../../responders/ward/raw/ward-raw-responder';

const COMMAND_ARG_INDEX = 2;

const COMMANDS = {
  run: 'run',
  list: 'list',
  detail: 'detail',
  raw: 'raw',
} as const;

export const WardFlow = async ({
  args,
  rootPath,
}: {
  args: readonly string[];
  rootPath: AbsoluteFilePath;
}): Promise<AdapterResult> => {
  const result = adapterResultContract.parse({ success: true });
  const rawCommand = args[COMMAND_ARG_INDEX];
  const isImplicitRun = !rawCommand || rawCommand.startsWith('-');
  const command = isImplicitRun ? COMMANDS.run : rawCommand;

  if (command === COMMANDS.run) {
    const normalizedArgs = isImplicitRun
      ? [...args.slice(0, COMMAND_ARG_INDEX), COMMANDS.run, ...args.slice(COMMAND_ARG_INDEX)]
      : args;
    await WardRunResponder({ args: normalizedArgs, rootPath });
    return result;
  }

  if (command === COMMANDS.list) {
    await WardListResponder({ args, rootPath });
    return result;
  }

  if (command === COMMANDS.detail) {
    await WardDetailResponder({ args, rootPath });
    return result;
  }

  if (command === COMMANDS.raw) {
    await WardRawResponder({ args, rootPath });
    return result;
  }

  // A NAME NOBODY ROUTES MUST NOT EXIT 0. Every caller of ward — a CI job, a pre-push gate, a
  // dispatched agent — reads the exit code as the verdict, so a subcommand that was renamed or
  // never existed comes back as a silent pass while nothing was checked at all.
  process.stderr.write(`Unknown command: ${command}\n`);
  process.stderr.write('Available commands: run, list, detail, raw\n');
  process.exitCode = wardExitCodeStatics.exitCodes.failing;
  return result;
};
