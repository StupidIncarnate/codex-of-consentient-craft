/**
 * PURPOSE: Adapter for StartOrchestrator.browseDirectories that wraps the orchestrator package
 *
 * USAGE:
 * const result = orchestratorBrowseDirectoriesAdapter({ path });
 * // Returns: DirectoryEntry[] or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { DirectoryEntry, GuildPath } from '@dungeonmaster/shared/contracts';

export const orchestratorBrowseDirectoriesAdapter = ({
  path,
}: {
  path?: GuildPath;
}): DirectoryEntry[] => StartOrchestrator.browseDirectories(path === undefined ? {} : { path });
