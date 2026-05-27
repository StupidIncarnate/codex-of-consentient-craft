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

import { WardRunResponder } from '../../responders/ward/run/ward-run-responder';
import { WardDetailResponder } from '../../responders/ward/detail/ward-detail-responder';
import { WardRawResponder } from '../../responders/ward/raw/ward-raw-responder';
import { WardRefsResponder } from '../../responders/ward/refs/ward-refs-responder';

const COMMAND_ARG_INDEX = 2;

const COMMANDS = {
  run: 'run',
  detail: 'detail',
  raw: 'raw',
  refsSync: 'refs:sync',
  refsCheck: 'refs:check',
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

  if (command === COMMANDS.detail) {
    await WardDetailResponder({ args, rootPath });
    return result;
  }

  if (command === COMMANDS.raw) {
    await WardRawResponder({ args, rootPath });
    return result;
  }

  if (command === COMMANDS.refsSync) {
    await WardRefsResponder({ args, rootPath, mode: 'sync' });
    return result;
  }

  if (command === COMMANDS.refsCheck) {
    await WardRefsResponder({ args, rootPath, mode: 'check' });
    return result;
  }

  process.stderr.write(`Unknown command: ${command}\n`);
  process.stderr.write('Available commands: run, detail, raw, refs:sync, refs:check\n');
  return result;
};
