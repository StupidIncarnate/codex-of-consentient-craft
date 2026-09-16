/**
 * PURPOSE: The whole `compare` answer — the index delta between two runs of ONE instance, plus the
 * pixel delta the same broker `pixelChange` uses (spec lines 2855-2861). `.strict()` on purpose: this
 * contract carries no `elements` field, and chunk-03 §3.F is why — a scoped element delta
 * (`'+0 -3 under GUILD_LIST'`) needs the selector key chunk 4 introduces, which does not exist in
 * this package yet. `.strict()` is what makes a later `elements: '...'` a parse error instead of a
 * silently accepted extra key. `pixels` is `.nullable()`, never always a string, because one of the
 * two runs may never have taken a shot. Reach for this over building `console`/`server`/`network` ad
 * hoc at a call site — this is the one shape both `siegelense-compare` and
 * `dungeonmaster siegelense compare` render from.
 *
 * USAGE:
 * compareAnswerContract.parse({
 *   instanceId: 'inst_7f3a9c21', runA: 'run_4', runB: 'run_5',
 *   console: { errors: '+2', new: ['Cannot read properties of null'] },
 *   server: { errors: '+0', new: [] },
 *   network: { non2xx: '+1', new: ['POST /api/guilds 500'] },
 *   pixels: 'last capture differs 12%',
 * });
 * // Returns a validated CompareAnswer
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { countDeltaContract } from '../count-delta/count-delta-contract';
import { instanceIdContract } from '../instance-id/instance-id-contract';
import { runIdContract } from '../run-id/run-id-contract';

export const compareAnswerContract = z
  .object({
    instanceId: instanceIdContract,
    runA: runIdContract,
    runB: runIdContract,
    console: z.object({
      errors: countDeltaContract,
      new: z.array(contentTextContract).readonly(),
    }),
    server: z.object({
      errors: countDeltaContract,
      new: z.array(contentTextContract).readonly(),
    }),
    network: z.object({
      non2xx: countDeltaContract,
      new: z.array(contentTextContract).readonly(),
    }),
    pixels: contentTextContract.nullable(),
  })
  .strict();

export type CompareAnswer = z.infer<typeof compareAnswerContract>;
