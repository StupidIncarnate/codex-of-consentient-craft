/**
 * PURPOSE: Handles GET /api/tooling/smoketest/state by delegating to the orchestrator and returning the current run state + recent events
 *
 * USAGE:
 * const result = ToolingSmoketestStateResponder();
 * // Returns: { status, data: { active, events } }
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const ToolingSmoketestStateResponder = (): ResponderResult => {
  const state = StartOrchestrator.getSmoketestState();
  return responderResultContract.parse({
    status: httpStatusStatics.success.ok,
    data: state,
  });
};
