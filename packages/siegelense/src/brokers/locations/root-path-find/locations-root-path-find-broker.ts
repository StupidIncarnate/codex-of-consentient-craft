/**
 * PURPOSE: Resolves the absolute path to this machine's siegelense root — the shared registry
 * directory every unrelated siegelense-driving session on this machine reads and writes, since
 * siegelense has no daemon and no master. Every other siegelense location resolver composes off
 * this one. Mirrors `locationsDispatchStatePathFindBroker` in `@dungeonmaster/shared`, which
 * answers the identical coordination question for the MCP server and the Node loop.
 *
 * USAGE:
 * locationsRootPathFindBroker();
 * // Returns AbsoluteFilePath '<dmHome>/siegelense'
 */

import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const locationsRootPathFindBroker = (): AbsoluteFilePath => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const joined = pathJoinAdapter({
    paths: [homePath, locationsStatics.siegelense.dir],
  });

  return absoluteFilePathContract.parse(joined);
};
