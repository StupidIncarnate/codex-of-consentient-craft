/**
 * PURPOSE: Adapter for StartOrchestrator.getNextStep that wraps the orchestrator package
 *
 * USAGE:
 * const step = await orchestratorGetNextStepAdapter();
 * // Returns: NextStep — { type: 'idle' } | { type: 'spawn-agents', agents } | { type: 'run-ward', ... }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { NextStep } from '@dungeonmaster/orchestrator';

export const orchestratorGetNextStepAdapter = async (): Promise<NextStep> =>
  StartOrchestrator.getNextStep();
