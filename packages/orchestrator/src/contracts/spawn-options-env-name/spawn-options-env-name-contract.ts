/**
 * PURPOSE: A key into a captured `SpawnOptions.env` snapshot — an environment variable name. A
 * caller reading a known variable (e.g. `'CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS'`) re-parses it
 * through this contract to index the branded `Record` `spawnOptionsSnapshotContract`'s `env` field
 * returns.
 *
 * USAGE:
 * spawnOptionsEnvNameContract.parse('CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS');
 * // Returns a branded SpawnOptionsEnvName
 */
import { z } from 'zod';

export const spawnOptionsEnvNameContract = z.string().brand<'SpawnOptionsEnvName'>();

export type SpawnOptionsEnvName = z.infer<typeof spawnOptionsEnvNameContract>;
