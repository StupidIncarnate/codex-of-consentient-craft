/**
 * PURPOSE: Defines the result of running checks against a single project folder
 *
 * USAGE:
 * projectResultContract.parse({projectFolder: {name: 'ward', path: '/path'}, status: 'pass', errors: [], testFailures: [], rawOutput: {stdout: '', stderr: '', exitCode: 0}});
 * // Returns: ProjectResult validated object
 */

import { z } from 'zod';
import { projectFolderContract } from '../project-folder/project-folder-contract';
import { checkStatusContract } from '../check-status/check-status-contract';
import { errorEntryContract } from '../error-entry/error-entry-contract';
import { testFailureContract } from '../test-failure/test-failure-contract';
import { rawOutputContract } from '../raw-output/raw-output-contract';

export const projectResultContract = z.object({
  projectFolder: projectFolderContract,
  status: checkStatusContract,
  errors: z.array(errorEntryContract),
  testFailures: z.array(testFailureContract),
  rawOutput: rawOutputContract,
  filesCount: z.number().int().nonnegative().brand<'FilesCount'>().default(0),
});

export type ProjectResult = z.infer<typeof projectResultContract>;
