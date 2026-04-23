/**
 * PURPOSE: Adapter for StartOrchestrator.runSmoketest — lets the server spawn a smoketest suite without touching orchestrator internals
 *
 * USAGE:
 * const result = await orchestratorRunSmoketestAdapter({ suite, startPath });
 * // Returns: { runId, results }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { FilePath, SmoketestSuite } from '@dungeonmaster/shared/contracts';

export const orchestratorRunSmoketestAdapter = async ({
  suite,
  startPath,
}: {
  suite: SmoketestSuite;
  startPath: FilePath;
}): Promise<Awaited<ReturnType<typeof StartOrchestrator.runSmoketest>>> =>
  StartOrchestrator.runSmoketest({ suite, startPath });
