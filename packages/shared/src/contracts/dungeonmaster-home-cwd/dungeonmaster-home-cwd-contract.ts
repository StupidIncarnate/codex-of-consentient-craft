/**
 * PURPOSE: Zod schema for an absolute path to the dungeonmaster home cwd (resolved ~/.dungeonmaster or DUNGEONMASTER_HOME)
 *
 * USAGE:
 * const cwd = dungeonmasterHomeCwdContract.parse('/home/user/.dungeonmaster');
 * // Returns branded DungeonmasterHomeCwd type — only obtainable via cwdResolveBroker or this contract's parse
 */

import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';
import type { z } from 'zod';

export const dungeonmasterHomeCwdContract =
  absoluteFilePathContract.brand<'DungeonmasterHomeCwd'>();

export type DungeonmasterHomeCwd = z.infer<typeof dungeonmasterHomeCwdContract>;
