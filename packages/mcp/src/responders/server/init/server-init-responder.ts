/**
 * PURPOSE: Initializes folder constraints state at MCP server startup
 *
 * USAGE:
 * await ServerInitResponder();
 * // Loads folder constraints from disk and populates in-memory state
 */

import { folderConstraintsInitBroker } from '../../../brokers/folder-constraints/init/folder-constraints-init-broker';
import { folderConstraintsState } from '../../../state/folder-constraints/folder-constraints-state';

export const ServerInitResponder = async (): Promise<void> => {
  const { folderConstraints } = await folderConstraintsInitBroker();
  for (const [folderType, content] of folderConstraints) {
    folderConstraintsState.set({ folderType, content });
  }
};
