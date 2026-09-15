/**
 * PURPOSE: One row of a run's `shots` list — every screenshot a batch captured, and whether a
 * session should actually open it (siegelense-tooling.md line 1600: "SCREENSHOTS are captured
 * always, and the RUN lists every one with an `open: true` flag… Putting the policy in the response
 * rather than in prompt text means no prompt carries it, no session remembers it, and 'did I get a
 * screenshot here?' is answered before it is asked"). Deliberately carries no `pixelChange` and no
 * `blank` — those need a pixel-diff dependency this chunk does not have, and the field is ABSENT
 * rather than shipped `null` (chunk-02-driver-and-batch.md §2, mirroring spec line 1585's "An absent
 * field is honest where an empty one invites a session to wonder what went wrong"). Reach for this
 * over StepReading: a StepReading is one step's whole outcome, while a ShotListing exists only for
 * the steps that captured — every acting step, plus `screenshot` itself.
 *
 * USAGE:
 * shotListingContract.parse({
 *   step: 2, path: '/repo/.siegelense/…/run_2/step2.png', open: true, why: 'start', node: null,
 * });
 * // Returns a validated ShotListing
 */

import { z } from 'zod';

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';

import { nodeLabelContract } from '../node-label/node-label-contract';
import { shotOpenReasonContract } from '../shot-open-reason/shot-open-reason-contract';
import { stepIndexContract } from '../step-index/step-index-contract';

export const shotListingContract = z.object({
  step: stepIndexContract,
  path: absoluteFilePathContract,
  open: z.boolean(),
  why: shotOpenReasonContract.nullable(),
  node: nodeLabelContract.nullable(),
});

export type ShotListing = z.infer<typeof shotListingContract>;
