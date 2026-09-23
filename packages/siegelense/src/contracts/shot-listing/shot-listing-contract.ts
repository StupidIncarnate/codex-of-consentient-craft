/**
 * PURPOSE: One row of a run's `shots` list — every screenshot a batch captured, and whether a
 * session should actually open it (siegelense-tooling.md line 1600: "SCREENSHOTS are captured
 * always, and the RUN lists every one with an `open: true` flag… Putting the policy in the response
 * rather than in prompt text means no prompt carries it, no session remembers it, and 'did I get a
 * screenshot here?' is answered before it is asked"). Carries the same `pixelChange`, `blank` and
 * `blankColour` a `StepReading` carries for the step this shot was taken at — a session scanning the
 * shot list decides which pictures are worth opening from these three fields alone, without a second
 * `results { step }` round trip to find out whether a given shot was blank or how much it changed.
 * `elements` stays absent rather than shipped `null` or `[]`: a scoped element delta needs the
 * container-tree key to scope it against, which lands with `look` in chunk 4. Reach for this over
 * StepReading: a StepReading is one step's whole outcome, while a ShotListing exists only for the
 * steps that captured — every acting step, plus `screenshot` itself.
 *
 * USAGE:
 * shotListingContract.parse({
 *   step: 2, path: '/repo/.dungeonmaster-assets/siegelense-assets/…/run_2/step2.png', open: true, why: 'start', node: null,
 *   pixelChange: '4%', blank: false, blankColour: null,
 * });
 * // Returns a validated ShotListing
 */

import { z } from 'zod';

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';

import { hexColourContract } from '../hex-colour/hex-colour-contract';
import { nodeLabelContract } from '../node-label/node-label-contract';
import { pixelChangeContract } from '../pixel-change/pixel-change-contract';
import { shotOpenReasonContract } from '../shot-open-reason/shot-open-reason-contract';
import { stepIndexContract } from '../step-index/step-index-contract';

export const shotListingContract = z.object({
  step: stepIndexContract,
  path: absoluteFilePathContract,
  open: z.boolean(),
  why: shotOpenReasonContract.nullable(),
  node: nodeLabelContract.nullable(),
  pixelChange: pixelChangeContract.nullable(),
  blank: z.boolean().nullable(),
  blankColour: hexColourContract.nullable(),
});

export type ShotListing = z.infer<typeof shotListingContract>;
