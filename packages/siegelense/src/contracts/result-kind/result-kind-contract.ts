/**
 * PURPOSE: The six kinds `results` accepts — `console`, `network`, `ws`, `server`, `screenshots`,
 * `steps` — derived from `resultsStatics.kinds.all` rather than retyped here, so a seventh kind
 * arriving later costs one edit instead of two lists kept in sync by hand. Reach for this over
 * `stepVerbContract` whenever the value names what `results` was asked to FETCH; StepVerb names
 * what a batch was asked to RUN, and the two vocabularies are deliberately separate closed sets.
 *
 * USAGE:
 * resultKindContract.parse('network');
 * // Returns a branded ResultKind
 */

import { z } from 'zod';

import { resultsStatics } from '../../statics/results/results-statics';

export const resultKindContract = z.enum(resultsStatics.kinds.all).brand<'ResultKind'>();

export type ResultKind = z.infer<typeof resultKindContract>;
