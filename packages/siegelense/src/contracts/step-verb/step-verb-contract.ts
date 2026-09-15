/**
 * PURPOSE: The six step verbs this chunk drives — `goto`, `waitFor`, `click`, `type`, `screenshot`,
 * `eval` — derived from `stepStatics.verbs.all` rather than retyped here, so a seventh verb arriving
 * in a later chunk costs one edit instead of two lists kept in sync by hand. Reach for this over a
 * raw `step` string literal anywhere a value is validated as belonging to the vocabulary rather than
 * merely shaped like one of its members.
 *
 * USAGE:
 * stepVerbContract.parse('click');
 * // Returns a branded StepVerb
 */

import { z } from 'zod';

import { stepStatics } from '../../statics/step/step-statics';

export const stepVerbContract = z.enum(stepStatics.verbs.all).brand<'StepVerb'>();

export type StepVerb = z.infer<typeof stepVerbContract>;
