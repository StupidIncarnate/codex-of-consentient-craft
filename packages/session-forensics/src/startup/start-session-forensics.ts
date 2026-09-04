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

const COMMAND_LINE_ARG_START_INDEX = 2;

export const StartSessionForensics = (): AdapterResult => {
  try {
    const argv = process.argv.slice(COMMAND_LINE_ARG_START_INDEX);
    const result = SessionForensicsFlow({ argv });
    process.stdout.write(`${result}\n`);
  } catch (error) {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  }

  return adapterResultContract.parse({ success: true });
};
