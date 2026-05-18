/**
 * PURPOSE: Adapter for StartOrchestrator.handleSignalBack that wraps the orchestrator package.
 * Lets the MCP signal-back tool fire the orchestrator's post-walk hook on a `pathseeker-walk`
 * complete signal without crossing the package boundary inline.
 *
 * USAGE:
 * await orchestratorHandleSignalBackAdapter({ questId, workItemId, signal: 'complete' });
 * // No-op for every signal/role pair except pathseeker-walk + complete.
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { AdapterResult, QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';

export const orchestratorHandleSignalBackAdapter = async ({
  questId,
  workItemId,
  signal,
}: {
  questId: QuestId;
  workItemId: QuestWorkItemId;
  signal: 'complete' | 'failed' | 'failed-replan';
}): Promise<AdapterResult> => StartOrchestrator.handleSignalBack({ questId, workItemId, signal });
