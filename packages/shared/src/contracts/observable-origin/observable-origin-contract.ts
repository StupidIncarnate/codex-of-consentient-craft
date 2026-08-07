/**
 * PURPOSE: Records where an observable came from — the spec at approval, or the role that added it
 * mid-quest
 *
 * USAGE:
 * observableOriginContract.parse('spec');
 * // Returns: ObservableOrigin enum value
 *
 * Provenance is a SEPARATE AXIS from verdicts. A verdict answers "does this hold, and with what
 * evidence"; an origin answers "was this observable in the spec at approval, or added while coding
 * and discovery happened — and by whom". `spec` means present at approval; every other value names
 * the role that added it after the fact.
 *
 * The axis exists so a track's denominator can exclude units it could never have reached: a role
 * that runs strictly AFTER a track cannot produce work that track was able to sign. An observable
 * with origin `siegemaster` can never receive a Flowrider sign-off, so counting it against
 * Flowrider's coverage would report a permanent, uncloseable hole.
 */

import { z } from 'zod';

export const observableOriginContract = z.enum([
  'spec',
  'chaoswhisperer',
  'codeweaver',
  'flowrider',
  'siegemaster',
  'operator',
]);

export type ObservableOrigin = z.infer<typeof observableOriginContract>;
