/**
 * PURPOSE: Defines the result structure for command execution with exit code and output streams.
 *
 * USAGE:
 * const result = commandResultContract.parse({ exitCode: 0, stdout: 'output', stderr: '' });
 * // Returns: CommandResult (object with exitCode, stdout, stderr)
 */
import { z } from 'zod';
import { exitCodeContract } from '../exit-code/exit-code-contract';
import { processOutputContract } from '../process-output/process-output-contract';

export const commandResultContract = z.object({
  exitCode: exitCodeContract,
  stdout: processOutputContract,
  stderr: processOutputContract,
});

export type CommandResult = z.infer<typeof commandResultContract>;
