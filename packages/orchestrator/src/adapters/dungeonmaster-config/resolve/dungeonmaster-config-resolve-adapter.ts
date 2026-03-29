/**
 * PURPOSE: Resolves the dungeonmaster configuration for a given project path
 *
 * USAGE:
 * const config = await dungeonmasterConfigResolveAdapter({ startPath: '/project' as FilePath });
 * // Returns resolved DungeonmasterConfig with merged settings from config files
 */

import { configResolveBroker } from '@dungeonmaster/config';
import type { DungeonmasterConfig } from '@dungeonmaster/config';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const dungeonmasterConfigResolveAdapter = async ({
  startPath,
}: {
  startPath: FilePath;
}): Promise<DungeonmasterConfig> => configResolveBroker({ filePath: startPath });
