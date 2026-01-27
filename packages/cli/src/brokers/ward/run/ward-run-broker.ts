/**
 * PURPOSE: Runs npm run ward command and returns parsed results
 *
 * USAGE:
 * const result = await wardRunBroker({projectPath: '/home/user/project'});
 * // Returns: {success: true, output: '', errors: []} or {success: false, output: '...', errors: [...]}
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { wardOutputContract } from '../../../contracts/ward-output/ward-output-contract';
import type { WardRunResult } from '../../../contracts/ward-run-result/ward-run-result-contract';
import { parseWardOutputTransformer } from '../../../transformers/parse-ward-output/parse-ward-output-transformer';
import { childProcessExecAdapter } from '../../../adapters/child-process/exec/child-process-exec-adapter';

export const wardRunBroker = async ({
  projectPath,
}: {
  projectPath: AbsoluteFilePath;
}): Promise<WardRunResult> => {
  const { stdout, stderr, exitCode } = await childProcessExecAdapter({
    command: 'npm run ward',
    cwd: projectPath,
  });

  const combinedOutput = wardOutputContract.parse(`${stdout}\n${stderr}`.trim());
  const errors = parseWardOutputTransformer({ output: combinedOutput });

  return {
    success: exitCode === 0,
    output: combinedOutput,
    errors,
  };
};
