/**
 * PURPOSE: A run's own verdict summary — console, server and network counts scoped to that run's
 * WINDOW into the instance's continuous buffers, never the running total since boot
 * (siegelense-tooling.md line 90: "A run's index counts its OWN window, never the running total.
 * Otherwise run 5 reports 47 console errors that are mostly run 1's"). Reach for this over
 * ShotListing whenever the value is the COUNTS that tell a session what is worth querying; a
 * ShotListing is one screenshot, while a RunIndex is the pointer that says how many of each kind of
 * reading exist before anyone queries a single one (siegelense-tooling.md line 59: "It must say
 * where it stopped, why, and what is worth querying"). `network.failed` counts 4xx/5xx and
 * no-response exchanges only (`isNetworkLineFailedGuard`); a redirect or a 304 is not a failure.
 *
 * USAGE:
 * runIndexContract.parse({
 *   console: { errors: 0, warnings: 2 },
 *   server: { errors: 0 },
 *   network: { exchanges: 14, failed: 0 },
 * });
 * // Returns a validated RunIndex
 */

import { z } from '#gateway/npm/zod';

export const runIndexContract = z
  .object({
    console: z
      .object({
        errors: z.number().int().nonnegative().brand<'RunIndexConsoleErrors'>(),
        warnings: z.number().int().nonnegative().brand<'RunIndexConsoleWarnings'>(),
      })
      .brand<'RunIndexConsole'>(),
    server: z
      .object({
        errors: z.number().int().nonnegative().brand<'RunIndexServerErrors'>(),
      })
      .brand<'RunIndexServer'>(),
    // A run file an older build wrote carries `non2xx` and no `failed`; it is read as `failed` so
    // `results` and `compare` still open it. That old count also included 3xx, so it can overcount.
    // Nothing is written back to the old file.
    network: z.preprocess(
      (value) =>
        typeof value === 'object' &&
        value !== null &&
        !('failed' in value) &&
        'non2xx' in value &&
        'exchanges' in value
          ? { exchanges: value.exchanges, failed: value.non2xx }
          : value,
      z
        .object({
          exchanges: z.number().int().nonnegative().brand<'RunIndexNetworkExchanges'>(),
          failed: z.number().int().nonnegative().brand<'RunIndexNetworkFailed'>(),
        })
        .brand<'RunIndexNetwork'>(),
    ),
  })
  .brand<'RunIndex'>();

export type RunIndex = z.infer<typeof runIndexContract>;
