/**
 * PURPOSE: Names one verb only this ingredient could have. Refuses every reserved verb, so an
 * extra can never shadow a built-in — `withNestedChain` is legal, `set` is not, no matter which
 * ingredient declares it.
 *
 * USAGE:
 * extraVerbNameContract.parse('withNestedChain');
 * // Returns a branded ExtraVerbName
 */
import { z } from 'zod';
import { reservedVerbStatics } from '../../statics/reserved-verb/reserved-verb-statics';

const RESERVED_VERBS: readonly string[] = reservedVerbStatics.verbs;

export const extraVerbNameContract = z
  .string()
  .min(1)
  .superRefine((value, ctx) => {
    if (RESERVED_VERBS.includes(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `'${value}' is a reserved verb and cannot be declared as an extra`,
      });
    }
  })
  .brand<'ExtraVerbName'>();

export type ExtraVerbName = z.infer<typeof extraVerbNameContract>;
