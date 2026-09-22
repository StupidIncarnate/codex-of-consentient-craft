/**
 * PURPOSE: One line of `runs/run_N.jsonl`, flushed as it ran (siegelense-tooling.md line 2554:
 * "`steps` is the transcript — every step with its verb, its arguments and its reading, flushed as
 * it ran"). Reach for this over StoppedAt: every step in a run produces one StepReading, whether it
 * succeeded or not, while a StoppedAt exists only on the ONE step that ended the batch. `shot` is
 * `null` for a non-acting step (`waitFor`, `eval`) that took no screenshot, never an absent key —
 * these lines are written to disk and read back, so a step that captured nothing must say so rather
 * than merely omit the field. `pixelChange`, `blank` and `blankColour` are `null` only when `shot` is
 * `null` — a step that captured nothing measured nothing (line 1630: "`pixelChange` is `null` on a
 * first capture, never `0`"). `previousReading` and `delta` are the element half of that same
 * pixel/element pair (`scrolls/seigelense/remaining-build-items.md` §13: one number alone is not
 * interpretable) — `previousReading` is the `KeyListing` `step-dispatch-broker.ts` reads immediately
 * before the step's own verb runs, and `delta` is what `elementDeltaComputeTransformer` finds between
 * it and the listing read immediately after. Both are `null` under the exact same condition as
 * `pixelChange` (a non-capturing step, or a before/after read that itself failed), and `delta` is
 * ALSO `null` whenever `previousReading` is — there is nothing to diff against. An EMPTY delta
 * (`{appeared: [], disappeared: [], changed: []}`) is never a stand-in for "did not check": it is
 * `elementDeltaComputeTransformer` reporting a genuine finding, that the step changed nothing on
 * screen. Both carry `.default(null)` rather than a bare `.nullable()`: the one caller of
 * `stepDispatchBroker` outside this pair's own construction sites — `runExecuteStepLayerBroker`'s
 * uncaught-exception branch — builds its own `StepReading` without either key, and a required key
 * there would throw on every real step failure. `serverWindow` is the byte range of `api-server.log`
 * this step's dispatch fell inside, real from the day this field lands rather than a placeholder —
 * the log itself is never copied into this reading, only sliced later by `results { kind: 'server' }`.
 *
 * USAGE:
 * stepReadingContract.parse({
 *   step: 2, verb: 'click', node: null, ok: true, expected: 'ok',
 *   reading: 'clicked [data-testid="GUILD_ADD"]', shot: '/repo/.siegelense/…/run_2/step2.png',
 *   pixelChange: '4%', blank: false, blankColour: null,
 *   previousReading: null, delta: null,
 *   serverWindow: { fromByte: 1024, toByte: 2048 },
 *   startedAtMs: 1700000000000, endedAtMs: 1700000000210,
 * });
 * // Returns a validated StepReading
 */

import { z } from 'zod';

import { absoluteFilePathContract, contentTextContract } from '@dungeonmaster/shared/contracts';

import { elementDeltaContract } from '../element-delta/element-delta-contract';
import { epochMsContract } from '../epoch-ms/epoch-ms-contract';
import { hexColourContract } from '../hex-colour/hex-colour-contract';
import { keyListingContract } from '../key-listing/key-listing-contract';
import { nodeLabelContract } from '../node-label/node-label-contract';
import { pixelChangeContract } from '../pixel-change/pixel-change-contract';
import { serverLogWindowContract } from '../server-log-window/server-log-window-contract';
import { stepExpectationContract } from '../step-expectation/step-expectation-contract';
import { stepIndexContract } from '../step-index/step-index-contract';
import { stepVerbContract } from '../step-verb/step-verb-contract';

export const stepReadingContract = z.object({
  step: stepIndexContract,
  verb: stepVerbContract,
  node: nodeLabelContract.nullable(),
  ok: z.boolean(),
  expected: stepExpectationContract,
  reading: contentTextContract,
  shot: absoluteFilePathContract.nullable(),
  pixelChange: pixelChangeContract.nullable(),
  blank: z.boolean().nullable(),
  blankColour: hexColourContract.nullable(),
  previousReading: keyListingContract.nullable().default(null),
  delta: elementDeltaContract.nullable().default(null),
  serverWindow: serverLogWindowContract,
  startedAtMs: epochMsContract,
  endedAtMs: epochMsContract,
});

export type StepReading = z.infer<typeof stepReadingContract>;
