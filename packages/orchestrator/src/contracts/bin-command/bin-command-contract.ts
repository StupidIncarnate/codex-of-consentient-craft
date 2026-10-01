/**
 * PURPOSE: How to start a dungeonmaster binary: the program to spawn and the arguments that come before
 * the binary's own. Reach for this from dungeonmasterBinResolveBroker's answer — `node <entry script>`
 * for a locally installed package, the bare binary name with no leading arguments otherwise.
 *
 * USAGE:
 * binCommandContract.parse({ command: '/usr/bin/node', leadingArgs: ['/repo/node_modules/@dungeonmaster/ward/dist/bin/ward-entry.js'] });
 * // Returns a BinCommand
 */

import { z } from '#gateway/npm/zod';

export const binCommandContract = z
  .object({
    command: z.string().min(1).brand<'BinCommandCommand'>(),
    leadingArgs: z.array(z.string().min(1).brand<'BinCommandLeadingArgs'>()),
  })
  .brand<'BinCommand'>();

export type BinCommand = z.infer<typeof binCommandContract>;
