/**
 * PURPOSE: Resolves a consumer repo's `.dungeonmaster.json` off a start path — the same
 * `configResolveBroker` the orchestrator's own adapter wraps, so siegelense reads the identical
 * config `dungeonmaster init` already writes rather than parsing a second copy of it.
 *
 * USAGE:
 * const config = await dungeonmasterConfigResolveAdapter({ startPath: '/project/.dungeonmaster.json' as FilePath });
 * // Returns the resolved DungeonmasterConfig
 */

import { configResolveBroker } from '@dungeonmaster/config';
import type { DungeonmasterConfig } from '@dungeonmaster/config';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const dungeonmasterConfigResolveAdapter = async ({
  startPath,
}: {
  startPath: FilePath;
}): Promise<DungeonmasterConfig> => configResolveBroker({ filePath: startPath });
