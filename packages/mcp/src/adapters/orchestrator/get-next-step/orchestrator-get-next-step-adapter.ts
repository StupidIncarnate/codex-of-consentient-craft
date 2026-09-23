/**
 * PURPOSE: Adapter for StartOrchestrator.getNextStep that wraps the orchestrator package
 *
 * USAGE:
 * const step = await orchestratorGetNextStepAdapter();
 * // Returns: NextStep — { type: 'idle' } | { type: 'spawn-agents', agents } | { type: 'run-step', ... };
 * // see @dungeonmaster/orchestrator's next-step-contract for the full variant list
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { NextStep } from '@dungeonmaster/orchestrator';

export const orchestratorGetNextStepAdapter = async (): Promise<NextStep> =>
  StartOrchestrator.getNextStep();
