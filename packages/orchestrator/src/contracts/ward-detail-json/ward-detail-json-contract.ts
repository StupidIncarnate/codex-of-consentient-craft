/**
 * PURPOSE: Validates the ward-result detail JSON shape that the orchestrator's spiritmender
 * batcher reads off disk. The full ward-result schema lives in the ward package; this
 * contract captures the subset the orchestrator consumes: per-file errors and per-suite test
 * failures grouped by absolute file path, plus the per-check/per-project `status`,
 * `projectFolder`, and (crash-only) `rawOutput` the batcher needs to build a catch-all batch
 * for a project that failed with no structured errors.
 *
 * USAGE:
 * const detail = wardDetailJsonContract.parse(JSON.parse(detailJsonString));
 * for (const check of detail.checks ?? []) { ... }
 *
 * `.loose()` on every nested object so unread ward fields (rawOutput trim is a separate
 * concern in the producer; ward emits more keys than this contract names) survive validation.
 */
import { z } from '#gateway/npm/zod';

const errorEntry = z
  .object({
    filePath: z.string().brand<'ErrorEntryFilePath'>().optional(),
    message: z.string().brand<'ErrorEntryMessage'>().optional(),
    line: z.number().brand<'ErrorEntryLine'>().optional(),
    column: z.number().brand<'ErrorEntryColumn'>().optional(),
    rule: z.string().brand<'ErrorEntryRule'>().optional(),
  })
  .brand<'ErrorEntry'>()
  .loose();

const testFailure = z
  .object({
    suitePath: z.string().brand<'TestFailureSuitePath'>().optional(),
    testName: z.string().brand<'TestFailureTestName'>().optional(),
    message: z.string().brand<'TestFailureMessage'>().optional(),
    stackTrace: z.string().brand<'TestFailureStackTrace'>().optional(),
  })
  .brand<'TestFailure'>()
  .loose();

const projectFolder = z
  .object({
    name: z.string().brand<'ProjectFolderName'>().optional(),
    path: z.string().brand<'ProjectFolderPath'>().optional(),
  })
  .brand<'ProjectFolder'>()
  .loose();

const rawOutput = z
  .object({
    stdout: z.string().brand<'RawOutputStdout'>().optional(),
    stderr: z.string().brand<'RawOutputStderr'>().optional(),
    exitCode: z.number().brand<'RawOutputExitCode'>().optional(),
  })
  .brand<'RawOutput'>()
  .loose();

const projectResult = z
  .object({
    projectFolder: projectFolder.optional(),
    status: z.enum(['pass', 'fail', 'skip']).optional(),
    errors: z.array(errorEntry).optional(),
    testFailures: z.array(testFailure).optional(),
    rawOutput: rawOutput.optional(),
  })
  .brand<'ProjectResult'>()
  .loose();

const checkResult = z
  .object({
    checkType: z.string().brand<'CheckResultCheckType'>().optional(),
    status: z.enum(['pass', 'fail', 'skip']).optional(),
    projectResults: z.array(projectResult).optional(),
  })
  .brand<'CheckResult'>()
  .loose();

export const wardDetailJsonContract = z
  .object({
    checks: z.array(checkResult).optional(),
  })
  .loose()
  .brand<'WardDetailJson'>();

export type WardDetailJson = z.infer<typeof wardDetailJsonContract>;
