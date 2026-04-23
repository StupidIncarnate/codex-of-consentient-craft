/**
 * PURPOSE: Handles GET /api/tooling/smoketest/state by delegating to the orchestrator adapter and returning the current run state + recent events
 *
 * USAGE:
 * const result = ToolingSmoketestStateResponder();
 * // Returns: { status, data: { active, events } }
 */

import { orchestratorGetSmoketestStateAdapter } from '../../../adapters/orchestrator/get-smoketest-state/orchestrator-get-smoketest-state-adapter';
import { responderResultContract } from '../../../contracts/responder-result/responder-result-contract';
import type { ResponderResult } from '../../../contracts/responder-result/responder-result-contract';
import { httpStatusStatics } from '../../../statics/http-status/http-status-statics';

export const ToolingSmoketestStateResponder = (): ResponderResult => {
  const state = orchestratorGetSmoketestStateAdapter();
  return responderResultContract.parse({
    status: httpStatusStatics.success.ok,
    data: state,
  });
};
