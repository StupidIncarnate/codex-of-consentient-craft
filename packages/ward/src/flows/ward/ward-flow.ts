/**
 * PURPOSE: Routes ward CLI subcommands to the appropriate responder
 *
 * USAGE:
 * await WardFlow({ args: ['node', 'ward', 'run'], rootPath: AbsoluteFilePathStub() });
 * // Delegates to WardRunResponder, WardListResponder, WardDetailResponder, or WardRawResponder
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

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
}): Promise<void> => {
  const command = args[COMMAND_ARG_INDEX] ?? COMMANDS.run;

  if (command === COMMANDS.run) {
    await WardRunResponder({ args, rootPath });
    return;
  }

  if (command === COMMANDS.list) {
    await WardListResponder({ args, rootPath });
    return;
  }

  if (command === COMMANDS.detail) {
    await WardDetailResponder({ args, rootPath });
    return;
  }

  if (command === COMMANDS.raw) {
    await WardRawResponder({ args, rootPath });
    return;
  }

  process.stderr.write(`Unknown command: ${command}\n`);
  process.stderr.write('Available commands: run, list, detail, raw\n');
};
