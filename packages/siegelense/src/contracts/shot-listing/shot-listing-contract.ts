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

import { z } from '#gateway/npm/zod';

import { shotOpenReasonContract } from '../shot-open-reason/shot-open-reason-contract';
import { instanceLifecycleStatics } from '../../statics/instance-lifecycle/instance-lifecycle-statics';

export const shotListingContract = z
  .object({
    step: z
      .number()
      .int()
      .min(instanceLifecycleStatics.numbering.firstStep)
      .brand<'ShotListingStep'>(),
    path: z
      .string()
      .min(1)
      .refine(
        (path) => {
          if (path.startsWith('/')) {
            return true;
          }
          if (/^[A-Za-z]:\\/u.test(path)) {
            return true;
          }
          return false;
        },
        { message: 'Path must be absolute (start with / or C:\\ on Windows)' },
      )
      .brand<'ShotListingPath'>(),
    open: z.boolean(),
    why: shotOpenReasonContract.nullable(),
    node: z.string().min(1).brand<'ShotListingNode'>().nullable(),
    pixelChange: z
      .string()
      .regex(/^(?:0 px|(?:<0\.01|\d{1,3}(?:\.\d{2})?)% \(\d+ px\)|\d{1,3}%)$/u)
      .brand<'ShotListingPixelChange'>()
      .nullable(),
    blank: z.boolean().nullable(),
    blankColour: z
      .string()
      .regex(/^#[0-9a-f]{6}$/u)
      .brand<'ShotListingBlankColour'>()
      .nullable(),
  })
  .brand<'ShotListing'>();

export type ShotListing = z.infer<typeof shotListingContract>;
