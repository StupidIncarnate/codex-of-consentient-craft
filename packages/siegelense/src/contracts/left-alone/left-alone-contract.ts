/**
 * PURPOSE: One instance `cleanup` chose NOT to touch, and why — the answer to "did you touch
 * anything of mine" (spec line 1366). Two reasons are real in this chunk: a live instance
 * (`'live — last beat 2s ago'`, spec line 1361) and a reserved-but-unbeaten registry row
 * (`'reserved — booting, no beat yet'`, the same protection `isStaleRegistryEntryGuard` already
 * gives `lastBeatMs: null`). Reach for this over dropping a skipped row silently — spec line 1365:
 * "A cleanup that reports only what it removed is indistinguishable from one that removed the wrong
 * thing."
 *
 * USAGE:
 * leftAloneContract.parse({ id: 'inst_7f3a', why: 'live — last beat 2s ago' });
 * // Returns a validated LeftAlone
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { instanceIdContract } from '../instance-id/instance-id-contract';

export const leftAloneContract = z.object({
  id: instanceIdContract,
  why: contentTextContract,
});

export type LeftAlone = z.infer<typeof leftAloneContract>;
