/**
 * PURPOSE: A run's own verdict summary — console, server and network counts scoped to that run's
 * WINDOW into the instance's continuous buffers, never the running total since boot
 * (siegelense-tooling.md line 90: "A run's index counts its OWN window, never the running total.
 * Otherwise run 5 reports 47 console errors that are mostly run 1's"). Reach for this over
 * ShotListing whenever the value is the COUNTS that tell a session what is worth querying; a
 * ShotListing is one screenshot, while a RunIndex is the pointer that says how many of each kind of
 * reading exist before anyone queries a single one (siegelense-tooling.md line 59: "It must say
 * where it stopped, why, and what is worth querying").
 *
 * USAGE:
 * runIndexContract.parse({
 *   console: { errors: 0, warnings: 2 },
 *   server: { errors: 0 },
 *   network: { exchanges: 14, non2xx: 0 },
 * });
 * // Returns a validated RunIndex
 */

import { z } from 'zod';

import { readingCountContract } from '../reading-count/reading-count-contract';

export const runIndexContract = z.object({
  console: z.object({
    errors: readingCountContract,
    warnings: readingCountContract,
  }),
  server: z.object({
    errors: readingCountContract,
  }),
  network: z.object({
    exchanges: readingCountContract,
    non2xx: readingCountContract,
  }),
});

export type RunIndex = z.infer<typeof runIndexContract>;
