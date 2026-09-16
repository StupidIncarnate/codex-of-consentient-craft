/**
 * PURPOSE: The whole `cleanup {}` answer — reaping by staleness, port release, lock release, and
 * `leftAlone` (spec lines 1357-1362). `.strict()` on purpose: this contract carries no `assetsAged`
 * field, and chunk-03 §3.E is why — ageing an asset needs a citation resolver that also covers a
 * `WALKED` line on an open quest, which is Part 7 item 11g's `questNotes` work in `shared` and
 * `orchestrator`, not this package's to write yet. Shipping ageing without that resolver unprotects a
 * clean happy walk's baseline shots (spec lines 241-244), so `cleanup` in this chunk reaps and
 * releases only — it never touches an asset — and `.strict()` is what makes a later
 * `assetsAged: {...}` a parse error instead of a silently accepted extra key. Reach for this over
 * building the four parts ad hoc: this is the one shape both `siegelense-cleanup` and
 * `dungeonmaster siegelense cleanup` render from.
 *
 * USAGE:
 * cleanupAnswerContract.parse({
 *   reaped: [{ id: 'inst_9b2c', staleFor: '9h', killed: [33812, 33840], homeRemoved: true }],
 *   portsReleased: [41345, 34173],
 *   lockReleased: true,
 *   leftAlone: [{ id: 'inst_7f3a', why: 'live — last beat 2s ago' }],
 * });
 * // Returns a validated CleanupAnswer
 */

import { z } from 'zod';

import { networkPortContract } from '@dungeonmaster/shared/contracts';

import { leftAloneContract } from '../left-alone/left-alone-contract';
import { reapedInstanceContract } from '../reaped-instance/reaped-instance-contract';

export const cleanupAnswerContract = z
  .object({
    reaped: z.array(reapedInstanceContract).readonly(),
    portsReleased: z.array(networkPortContract).readonly(),
    lockReleased: z.boolean(),
    leftAlone: z.array(leftAloneContract).readonly(),
  })
  .strict();

export type CleanupAnswer = z.infer<typeof cleanupAnswerContract>;
