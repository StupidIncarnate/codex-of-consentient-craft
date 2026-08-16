/**
 * PURPOSE: Does the once-per-MCP-child disk reading, so no tool call pays for it — folder
 * constraints for get-folder-detail, and the merged .gitignore ignore list every discover scans
 * with. Anything a tool needs from disk that does not change between calls belongs here rather
 * than in the tool's own path.
 *
 * USAGE:
 * await ServerInitResponder();
 * // Loads folder constraints and the discover ignore list from disk into in-memory state
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import { discoverIgnoreInitBroker } from '../../../brokers/discover-ignore/init/discover-ignore-init-broker';
import { folderConstraintsInitBroker } from '../../../brokers/folder-constraints/init/folder-constraints-init-broker';
import { discoverIgnoreState } from '../../../state/discover-ignore/discover-ignore-state';
import { folderConstraintsState } from '../../../state/folder-constraints/folder-constraints-state';

export const ServerInitResponder = async (): Promise<AdapterResult> => {
  const [{ folderConstraints }, ignorePatterns] = await Promise.all([
    folderConstraintsInitBroker(),
    discoverIgnoreInitBroker(),
  ]);

  for (const [folderType, content] of folderConstraints) {
    folderConstraintsState.set({ folderType, content });
  }

  discoverIgnoreState.set({ patterns: ignorePatterns });

  return adapterResultContract.parse({ success: true });
};
