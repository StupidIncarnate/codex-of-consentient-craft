/**
 * PURPOSE: Resolves a binary name to its absolute path in node_modules/.bin/, falling back to bare name
 *
 * USAGE:
 * const command = binResolveBroker({ binName: BinCommandStub({ value: 'eslint' }), cwd: absoluteFilePathContract.parse('/project') });
 * // Returns BinCommand('/project/node_modules/.bin/eslint') if it exists, otherwise BinCommand('eslint')
 */

import { fsExistsSyncAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import {
  binCommandContract,
  type BinCommand,
} from '../../../contracts/bin-command/bin-command-contract';

export const binResolveBroker = ({
  binName,
  cwd,
}: {
  binName: BinCommand;
  cwd: AbsoluteFilePath;
}): BinCommand => {
  const binPath = filePathContract.parse(`${String(cwd)}/node_modules/.bin/${String(binName)}`);
  const exists = fsExistsSyncAdapter({ filePath: binPath });
  return exists ? binCommandContract.parse(String(binPath)) : binName;
};
