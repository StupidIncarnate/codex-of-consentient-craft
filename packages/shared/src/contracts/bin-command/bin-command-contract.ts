/**
 * PURPOSE: How to start a dungeonmaster binary: the program to spawn and the arguments that come before
 * the binary's own. Reach for this as packageBinResolveBroker's answer — always `node <entry script>`,
 * never a bare binary name that PATH would resolve to some other checkout.
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
