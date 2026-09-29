/**
 * PURPOSE: The CLI entry point for session forensics digests. It slices the real `process.argv`
 * down to the command and target the caller typed, and hands them to the session-forensics flow.
 * It prints the rendered text to stdout. If the flow throws, it prints the error to stderr instead
 * and sets a non-zero exit code.
 *
 * USAGE:
 * StartSessionForensics();
 * // Writes the flow's rendered ContentText, or a usage block, to stdout with a trailing newline.
 */
import { adapterResultContract, type AdapterResult } from '@dungeonmaster/shared/contracts';

import { SessionForensicsFlow } from '../flows/session-forensics/session-forensics-flow';
import { argv as processArgv, setExitCode, stderr, stdout } from '#gateway/node/process';

const COMMAND_LINE_ARG_START_INDEX = 2;

export const StartSessionForensics = (): AdapterResult => {
  try {
    const argv = processArgv.slice(COMMAND_LINE_ARG_START_INDEX);
    const result = SessionForensicsFlow({ argv });
    stdout.write(`${result}\n`);
  } catch (error) {
    stderr.write(`${String(error)}\n`);
    setExitCode(1);
  }

  return adapterResultContract.parse({ success: true });
};
