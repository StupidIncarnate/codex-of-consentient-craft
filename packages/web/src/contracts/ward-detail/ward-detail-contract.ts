/**
 * PURPOSE: Validates the subset of the on-disk ward-result detail JSON the web renders — the
 * per-check, per-file lint/typecheck errors and per-suite test failures. The orchestrator writes
 * this blob to <questFolder>/ward-results/<wardResultId>.json and the server relays it verbatim
 * over the ward-detail-response WebSocket frame as `detail: unknown`; this contract is what the
 * web safe-parses that unknown into before flattening it into display lines.
 *
 * USAGE:
 * const parsed = wardDetailContract.safeParse(detail);
 * if (parsed.success) for (const check of parsed.data.checks ?? []) { ... }
 * // Every nested object is .passthrough() so unread ward fields survive validation.
 */

import { z } from 'zod';

const errorEntry = z
  .object({
    filePath: z.string().brand<'WardDetailErrorFilePath'>().optional(),
    message: z.string().brand<'WardDetailErrorMessage'>().optional(),
    line: z.number().brand<'WardDetailErrorLine'>().optional(),
    rule: z.string().brand<'WardDetailErrorRule'>().optional(),
  })
  .passthrough();

const testFailure = z
  .object({
    suitePath: z.string().brand<'WardDetailSuitePath'>().optional(),
    testName: z.string().brand<'WardDetailTestName'>().optional(),
    message: z.string().brand<'WardDetailTestFailureMessage'>().optional(),
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
    checkType: z.string().brand<'WardDetailCheckType'>().optional(),
    projectResults: z.array(projectResult).optional(),
  })
  .passthrough();

export const wardDetailContract = z
  .object({
    checks: z.array(checkResult).optional(),
  })
  .passthrough();

export type WardDetail = z.infer<typeof wardDetailContract>;
