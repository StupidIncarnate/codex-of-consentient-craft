import { z } from 'zod';
import { exitCodeContract } from '../exit-code/exit-code-contract';
import { processOutputContract } from '../process-output/process-output-contract';

export const commandResultContract = z.object({
  exitCode: exitCodeContract,
  stdout: processOutputContract,
  stderr: processOutputContract,
});

export type CommandResult = z.infer<typeof commandResultContract>;
