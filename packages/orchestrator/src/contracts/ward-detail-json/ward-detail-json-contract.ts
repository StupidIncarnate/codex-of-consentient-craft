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
 * `.passthrough()` on every nested object so unread ward fields (rawOutput trim is a separate
 * concern in the producer; ward emits more keys than this contract names) survive validation.
 */
import { z } from 'zod';

const errorEntry = z
  .object({
    filePath: z.string().brand<'WardDetailErrorFilePath'>().optional(),
    message: z.string().brand<'WardDetailErrorMessage'>().optional(),
    line: z.number().brand<'WardDetailErrorLine'>().optional(),
    column: z.number().brand<'WardDetailErrorColumn'>().optional(),
    rule: z.string().brand<'WardDetailErrorRule'>().optional(),
  })
  .passthrough();

const testFailure = z
  .object({
    suitePath: z.string().brand<'WardDetailSuitePath'>().optional(),
    testName: z.string().brand<'WardDetailTestName'>().optional(),
    message: z.string().brand<'WardDetailTestFailureMessage'>().optional(),
    stackTrace: z.string().brand<'WardDetailStackTrace'>().optional(),
  })
  .passthrough();

const projectFolder = z
  .object({
    name: z.string().brand<'WardDetailProjectName'>().optional(),
    path: z.string().brand<'WardDetailProjectPath'>().optional(),
  })
  .passthrough();

const rawOutput = z
  .object({
    stdout: z.string().brand<'WardDetailRawStdout'>().optional(),
    stderr: z.string().brand<'WardDetailRawStderr'>().optional(),
    exitCode: z.number().brand<'WardDetailRawExitCode'>().optional(),
  })
  .passthrough();

const projectResult = z
  .object({
    projectFolder: projectFolder.optional(),
    status: z.enum(['pass', 'fail', 'skip']).optional(),
    errors: z.array(errorEntry).optional(),
    testFailures: z.array(testFailure).optional(),
    rawOutput: rawOutput.optional(),
  })
  .passthrough();

const checkResult = z
  .object({
    checkType: z.string().brand<'WardDetailCheckType'>().optional(),
    status: z.enum(['pass', 'fail', 'skip']).optional(),
    projectResults: z.array(projectResult).optional(),
  })
  .passthrough();

export const wardDetailJsonContract = z
  .object({
    checks: z.array(checkResult).optional(),
  })
  .passthrough();

export type WardDetailJson = z.infer<typeof wardDetailJsonContract>;
