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
import { passingTestContract } from '../passing-test/passing-test-contract';
import { openHandleContract } from '../open-handle/open-handle-contract';
import { testNamePatternMatchContract } from '../test-name-pattern-match/test-name-pattern-match-contract';
import { durationMsContract } from '../duration-ms/duration-ms-contract';

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
  passingTests: z.array(passingTestContract).default([]),
  // Async resources still open when the suite finished. Jest can only collect these while running
  // in band, so this is populated on a FILE-scoped run and empty on a worker run — an empty array
  // means "nobody looked", never "nothing leaked".
  openHandles: z.array(openHandleContract).default([]),
  // Absent unless the check applied a --onlyTests pattern, which lets the run distinguish a check
  // that never filtered by name (lint, typecheck) from one that filtered and found nothing.
  testNamePatternMatch: testNamePatternMatchContract.optional(),
  // This package's own wall clock for the check, distinct from checkResultContract's durationMs —
  // that one is the whole check across every package (see multi-package-layer-broker). Defaults
  // to 0 so parses that predate this field (saved .ward/ results, precomputed typecheck results with
  // no per-package split) keep working.
  durationMs: durationMsContract.default(0),
});

export type ProjectResult = z.infer<typeof projectResultContract>;
