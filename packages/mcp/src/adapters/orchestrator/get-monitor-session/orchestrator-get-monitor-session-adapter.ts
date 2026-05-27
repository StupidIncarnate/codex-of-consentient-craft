/**
 * PURPOSE: Adapter for StartOrchestrator.getRegisteredMonitorSession — returns the registered
 * /dumpster-launch parent session so the MCP layer can deterministically identify a sub-agent
 * caller (paired with `request.params._meta.claudecode/toolUseId`) without falling back to the
 * mtime-based session resolver. Returns null when no /dumpster-launch session is registered.
 *
 * USAGE:
 * const session = orchestratorGetMonitorSessionAdapter();
 * // Returns: { sessionId, projectDir } | null
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { FilePath, SessionId } from '@dungeonmaster/shared/contracts';

export const orchestratorGetMonitorSessionAdapter = (): {
  sessionId: SessionId;
  projectDir: FilePath;
} | null => StartOrchestrator.getRegisteredMonitorSession();
