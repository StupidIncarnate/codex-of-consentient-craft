/**
 * PURPOSE: One INSTANCE's on-disk memory record inside `profiles/<specHash>/samples/` — everything
 * that instance's own driver measured across its life, rewritten whole on every beat so a SIGKILLed
 * driver leaves every reading it already took behind. Reach for this over `SpecProfile`: this is the
 * raw per-instance record a sampler writes, while `SpecProfile` is the folded answer `profile` hands
 * back across every instance ever measured for one spec.
 *
 * `pools` holds a bucket PER pool size rather than one pair of numbers plus a pool size, because the
 * pool can change inside one instance's life — a second instance starts while this one is still
 * running. A record with a single pool size would have to pick one and blend readings taken under
 * both, which is the averaging siegelense-tooling.md line 1489 forbids, one level down.
 * `steadySumMB` and `steadyBeats` are kept rather than a running mean so the answer can pool
 * readings across runs without taking a mean of means; `peakMB` takes every beat while the steady
 * pair takes only beats past `profileStatics.settle.afterMs`, which is the difference between "what
 * it spikes to" and "what it settles at".
 *
 * USAGE:
 * profileObservationContract.parse({
 *   instanceId: 'inst_7f3a9c21',
 *   specHash: 'a3f9c2e1',
 *   firstBeatAtMs: 1700000000000,
 *   measuredAtMs: 1700000600000,
 *   pools: [{ poolSize: 1, peakMB: 2600, steadySumMB: 12600, steadyBeats: 7 }],
 * });
 * // Returns a validated ProfileObservation
 */

import { z } from 'zod';

import { epochMsContract } from '../epoch-ms/epoch-ms-contract';
import { instanceIdContract } from '../instance-id/instance-id-contract';
import { megabytesContract } from '../megabytes/megabytes-contract';
import { profilePoolSizeContract } from '../profile-pool-size/profile-pool-size-contract';
import { readingCountContract } from '../reading-count/reading-count-contract';
import { specHashContract } from '../spec-hash/spec-hash-contract';

export const profileObservationContract = z.object({
  instanceId: instanceIdContract,
  specHash: specHashContract,
  firstBeatAtMs: epochMsContract,
  measuredAtMs: epochMsContract,
  pools: z
    .array(
      z.object({
        poolSize: profilePoolSizeContract,
        peakMB: megabytesContract,
        steadySumMB: megabytesContract,
        steadyBeats: readingCountContract,
      }),
    )
    .readonly(),
});

export type ProfileObservation = z.infer<typeof profileObservationContract>;
