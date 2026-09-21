/**
 * PURPOSE: Validates the subset of the on-disk ward-result detail JSON its readers act on — the
 * per-check, per-file lint/typecheck errors and per-suite test failures, plus the per-check/
 * per-project `status`, `projectFolder`, and (crash-only) `rawOutput` used to render a failing
 * project that produced no structured errors. A check ward flagged with `discoveryMismatch` also
 * carries per-project `filesCount` / `discoveredCount` and the `onlyDiscovered` / `onlyProcessed`
 * file lists, used to render the discovery-mismatch breakdown.
 *
 * It lives in `shared` because BOTH sides read the same blob: `web` safe-parses the
 * `detail: unknown` the server relays over the ward-detail-response WebSocket frame, and the
 * orchestrator reads `<questFolder>/ward-results/<wardResultId>.json` to tell `get-quest-work`
 * which check types went red and which paths they named. Neither package may own the shape — the
 * orchestrator cannot import `web`, and a second copy drifts the day ward emits a new key.
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
    filesCount: z.number().brand<'WardDetailFilesCount'>().optional(),
    discoveredCount: z.number().brand<'WardDetailDiscoveredCount'>().optional(),
    onlyDiscovered: z.array(z.string().brand<'WardDetailOnlyDiscovered'>()).optional(),
    onlyProcessed: z.array(z.string().brand<'WardDetailOnlyProcessed'>()).optional(),
  })
  .passthrough();

const checkResult = z
  .object({
    checkType: z.string().brand<'WardDetailCheckType'>().optional(),
    status: z.enum(['pass', 'fail', 'skip']).optional(),
    discoveryMismatch: z.boolean().optional(),
    projectResults: z.array(projectResult).optional(),
  })
  .passthrough();

export const wardDetailContract = z
  .object({
    checks: z.array(checkResult).optional(),
  })
  .passthrough();

export type WardDetail = z.infer<typeof wardDetailContract>;
