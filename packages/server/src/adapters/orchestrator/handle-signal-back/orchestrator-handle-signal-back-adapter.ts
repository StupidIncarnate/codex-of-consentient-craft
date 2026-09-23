/**
 * PURPOSE: Adapter for StartOrchestrator.handleSignalBack that wraps the orchestrator package.
 * Lets the env-gated HTTP signal-back endpoint mark the work item terminal, apply the linked
 * operation's outcome to the quest ledger, and advance the relay without crossing the package
 * boundary inline — the same orchestrator surface the MCP signal-back tool uses.
 *
 * USAGE:
 * await orchestratorHandleSignalBackAdapter({ questId, workItemId, signal: 'complete', operationItemId });
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
  blockedReason,
}: {
  questId: QuestId;
  workItemId: QuestWorkItemId;
  signal: 'complete';
  operationItemId?: OperationItemId;
  blockedReason?: BlockedReason;
}): Promise<AdapterResult> =>
  StartOrchestrator.handleSignalBack({
    questId,
    workItemId,
    signal,
    ...(operationItemId === undefined ? {} : { operationItemId }),
    ...(blockedReason === undefined ? {} : { blockedReason }),
  });
