/**
 * PURPOSE: Adapter for StartOrchestrator.createWorktree that wraps the orchestrator package
 *
 * USAGE:
 * const { worktreePath } = await orchestratorCreateWorktreeAdapter({ name: 'probe' });
 * // Returns: the absolute path of the carved, mirrored, seeded and audited worktree
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

export const orchestratorCreateWorktreeAdapter = async ({
  name,
}: {
  name: string;
}): Promise<Awaited<ReturnType<typeof StartOrchestrator.createWorktree>>> =>
  StartOrchestrator.createWorktree({ name });
