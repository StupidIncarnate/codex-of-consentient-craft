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
 * // Every nested object is .loose() so unread ward fields survive validation.
 */

import { z } from '#gateway/npm/zod';

const errorEntry = z
  .object({
    filePath: z.string().brand<'ErrorEntryFilePath'>().optional(),
    message: z.string().brand<'ErrorEntryMessage'>().optional(),
    line: z.number().brand<'ErrorEntryLine'>().optional(),
    rule: z.string().brand<'ErrorEntryRule'>().optional(),
  })
  .brand<'ErrorEntry'>()
  .loose();

const testFailure = z
  .object({
    suitePath: z.string().brand<'TestFailureSuitePath'>().optional(),
    testName: z.string().brand<'TestFailureTestName'>().optional(),
    message: z.string().brand<'TestFailureMessage'>().optional(),
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
    filesCount: z.number().brand<'ProjectResultFilesCount'>().optional(),
    discoveredCount: z.number().brand<'ProjectResultDiscoveredCount'>().optional(),
    onlyDiscovered: z.array(z.string().brand<'ProjectResultOnlyDiscovered'>()).optional(),
    onlyProcessed: z.array(z.string().brand<'ProjectResultOnlyProcessed'>()).optional(),
  })
  .brand<'ProjectResult'>()
  .loose();

const checkResult = z
  .object({
    checkType: z.string().brand<'CheckResultCheckType'>().optional(),
    status: z.enum(['pass', 'fail', 'skip']).optional(),
    discoveryMismatch: z.boolean().optional(),
    projectResults: z.array(projectResult).optional(),
  })
  .brand<'CheckResult'>()
  .loose();

export const wardDetailContract = z
  .object({
    checks: z.array(checkResult).optional(),
  })
  .loose()
  .brand<'WardDetail'>();

export type WardDetail = z.infer<typeof wardDetailContract>;
