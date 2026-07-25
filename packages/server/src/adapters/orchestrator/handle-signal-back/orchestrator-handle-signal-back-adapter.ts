/**
 * PURPOSE: Adapter for StartOrchestrator.handleSignalBack that wraps the orchestrator package.
 * Lets the env-gated HTTP signal-back endpoint apply a session's operation outcome
 * (done/partial/blocked) to the quest ledger and advance the relay without crossing the package
 * boundary inline — the same orchestrator surface the MCP signal-back tool uses.
 *
 * USAGE:
 * await orchestratorHandleSignalBackAdapter({ questId, workItemId, signal: 'complete', operationItemId, operationStatus: 'done' });
 * // Marks the work item terminal, applies the operation outcome, advances the relay.
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type {
  AdapterResult,
  BlockedReason,
  OperationItemId,
  QuestId,
  QuestWorkItemId,
} from '@dungeonmaster/shared/contracts';

export const orchestratorHandleSignalBackAdapter = async ({
  questId,
  workItemId,
  signal,
  operationItemId,
  operationStatus,
  blockedReason,
}: {
  questId: QuestId;
  workItemId: QuestWorkItemId;
  signal: 'complete';
  operationItemId?: OperationItemId;
  operationStatus?: 'done' | 'partial' | 'blocked';
  blockedReason?: BlockedReason;
}): Promise<AdapterResult> =>
  StartOrchestrator.handleSignalBack({
    questId,
    workItemId,
    signal,
    ...(operationItemId === undefined ? {} : { operationItemId }),
    ...(operationStatus === undefined ? {} : { operationStatus }),
    ...(blockedReason === undefined ? {} : { blockedReason }),
  });
