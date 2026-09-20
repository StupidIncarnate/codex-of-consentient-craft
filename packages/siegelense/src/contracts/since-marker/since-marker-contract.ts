/**
 * PURPOSE: The one legal value of a `results` query's `since` field — `resultsStatics.since.boot`
 * — so a typo like `'boott'` is a parse error rather than silently falling through to whichever
 * run a missing `since` and a missing `run` would otherwise default to. Reach for this over
 * checking `since === 'boot'` inline anywhere the field is read; a `z.literal` derived from the
 * static is what keeps the one legal spelling in one place.
 *
 * USAGE:
 * sinceMarkerContract.parse('boot');
 * // Returns: 'boot' as SinceMarker
 */

import { z } from 'zod';

import { resultsStatics } from '../../statics/results/results-statics';

export const sinceMarkerContract = z.literal(resultsStatics.since.boot).brand<'SinceMarker'>();

export type SinceMarker = z.infer<typeof sinceMarkerContract>;
