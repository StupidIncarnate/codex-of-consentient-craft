/**
 * PURPOSE: The whole `compare` answer — the index delta between two runs of ONE instance, the pixel
 * delta the same broker `pixelChange` uses (spec lines 2855-2861), and the element delta each run's
 * own transcript recorded. `.strict()` on purpose: a caller's typo is a parse error naming the stray
 * key, not a query that silently runs with it dropped. `pixels` is `.nullable()`, never always a
 * string, because one of the two runs may never have taken a shot. `elements.runA`/`elements.runB`
 * are each the `delta` off the LAST step in that run's own transcript that recorded a non-null one
 * (`stepReadingContract`'s own `delta`, `scrolls/seigelense/remaining-build-items.md` §13a) — `null`
 * when the run captured no acting step, or none of its steps produced one. This is the minimum
 * honest answer, side by side, rather than the scoped-by-selector summary §13's own example shows
 * (`'+7 under GUILD_ADD_MODAL, -0, moved 2'`): that format groups by a selector key this package does
 * not build yet, and `compare` only ever reads stored evidence — it never re-drives a page to compute
 * a fresh cross-run diff, so each side's own last recorded delta is the whole record available to it.
 * `network.errors` counts exactly what `network.new` lists — a 4xx/5xx status or no response at all —
 * the same relationship `console.errors`/`server.errors` each have with their own `new:` list. It is
 * a narrower, DIFFERENT reading than `run`'s own persisted `RunIndex.network.non2xx`, which counts
 * every deviation from the [200, 300) range, an ordinary 3xx redirect included. Reach for this over
 * building `console`/`server`/`network` ad hoc at a call site — this is the one shape both
 * `siegelense-compare` and `dungeonmaster siegelense compare` render from.
 *
 * USAGE:
 * compareAnswerContract.parse({
 *   instanceId: 'inst_7f3a9c21', runA: 'run_4', runB: 'run_5',
 *   console: { errors: '+2', new: ['Cannot read properties of null'] },
 *   server: { errors: '+0', new: [] },
 *   network: { errors: '+1', new: ['POST /api/guilds 500'] },
 *   pixels: 'last capture differs 12%',
 *   elements: { runA: null, runB: { appeared: [], disappeared: [], changed: [] } },
 * });
 * // Returns a validated CompareAnswer
 */

import { z } from '#gateway/npm/zod';

import { siegeInstanceContract, siegeRunContract } from '@dungeonmaster/shared/contracts';

import { elementDeltaContract } from '../element-delta/element-delta-contract';

export const compareAnswerContract = z
  .object({
    instanceId: siegeInstanceContract.shape.id,
    runA: siegeRunContract.shape.id,
    runB: siegeRunContract.shape.id,
    console: z.object({
      errors: z.string().regex(/^[+-]\d+$/u).brand<'CompareAnswerConsoleErrors'>(),
      new: z.array(z.string().brand<'CompareAnswerConsoleNew'>()).readonly(),
    }),
    server: z.object({
      errors: z.string().regex(/^[+-]\d+$/u).brand<'CompareAnswerServerErrors'>(),
      new: z.array(z.string().brand<'CompareAnswerServerNew'>()).readonly(),
    }),
    network: z.object({
      errors: z.string().regex(/^[+-]\d+$/u).brand<'CompareAnswerNetworkErrors'>(),
      new: z.array(z.string().brand<'CompareAnswerNetworkNew'>()).readonly(),
    }),
    pixels: z.string().brand<'CompareAnswerPixels'>().nullable(),
    elements: z
      .object({
        runA: elementDeltaContract.nullable(),
        runB: elementDeltaContract.nullable(),
      })
      .strict(),
    consoleErrorDelta: z.number().int().brand<'ConsoleErrorDelta'>().optional(),
    serverErrorDelta: z.number().int().brand<'ServerErrorDelta'>().optional(),
    networkNon2xxDelta: z.number().int().brand<'NetworkNon2xxDelta'>().optional(),
    pixelDiffCount: z.number().int().nonnegative().brand<'CompareAnswerPixelDiffCount'>().optional(),
  })
  .strict().brand<'CompareAnswer'>();

export type CompareAnswer = z.infer<typeof compareAnswerContract>;
