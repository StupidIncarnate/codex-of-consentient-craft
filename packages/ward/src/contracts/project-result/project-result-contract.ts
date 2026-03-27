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
import { gitRelativePathContract } from '../git-relative-path/git-relative-path-contract';
import { fileTimingContract } from '../file-timing/file-timing-contract';

export const projectResultContract = z.object({
  projectFolder: projectFolderContract,
  status: checkStatusContract,
  errors: z.array(errorEntryContract),
  testFailures: z.array(testFailureContract),
  rawOutput: rawOutputContract.default({ stdout: '', stderr: '', exitCode: 0 }),
  filesCount: z.number().int().nonnegative().brand<'FilesCount'>().default(0),
  discoveredCount: z.number().int().nonnegative().brand<'DiscoveredCount'>().default(0),
  onlyDiscovered: z.array(gitRelativePathContract).default([]),
  onlyProcessed: z.array(gitRelativePathContract).default([]),
  fileTimings: z.array(fileTimingContract).default([]),
});

export type ProjectResult = z.infer<typeof projectResultContract>;
