/**
 * PURPOSE: Validates the ward-result detail JSON shape that the orchestrator's spiritmender
 * batcher reads off disk. The full ward-result schema lives in the ward package; this
 * contract captures only the subset the orchestrator consumes (per-file errors and per-suite
 * test failures grouped by absolute file path).
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

const projectResult = z
  .object({
    errors: z.array(errorEntry).optional(),
    testFailures: z.array(testFailure).optional(),
  })
  .passthrough();

const checkResult = z
  .object({
    projectResults: z.array(projectResult).optional(),
  })
  .passthrough();

export const wardDetailJsonContract = z
  .object({
    checks: z.array(checkResult).optional(),
  })
  .passthrough();

export type WardDetailJson = z.infer<typeof wardDetailJsonContract>;
