/**
 * PURPOSE: Adapter for StartOrchestrator.getServerConfig that wraps the orchestrator package
 *
 * USAGE:
 * const { baseUrl, port } = orchestratorGetServerConfigAdapter();
 * // Returns: QuestGetServerConfigResult — `{baseUrl, port}` for the running dungeonmaster server
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestGetServerConfigResult } from '@dungeonmaster/orchestrator';

export const orchestratorGetServerConfigAdapter = (): QuestGetServerConfigResult =>
  StartOrchestrator.getServerConfig();
