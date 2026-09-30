/**
 * PURPOSE: The one op kind whose VERB is not fixed by the framework — every ingredient may declare
 * its own, so this is the only op that carries the verb's own name alongside its args. Reach for
 * this over the other five wherever the call is not `set`, `setRaw`, `remove`, `saveRecordAs` or
 * `filter`: `extraVerbNameContract` already refuses those five names, so this op and the other five
 * can never collide.
 *
 * USAGE:
 * opExtraContract.parse({ op: 'extra', ref: 'session[0:0]', verb: 'withNestedChain', args: { depth: 2 } });
 * // Returns an OpExtra
 */
import { z } from '#gateway/npm/zod';
import { reservedVerbStatics } from '../../statics/reserved-verb/reserved-verb-statics';
import { fieldValuesContract } from '../field-values/field-values-contract';

const reservedVerbs: readonly string[] = reservedVerbStatics.verbs;

export const opExtraContract = z
  .object({
    op: z.literal('extra'),
    ref: z.string().min(1).brand<'OpExtraRef'>(),
    verb: z
      .string()
      .min(1)
      .refine((verb) => !reservedVerbs.includes(verb), { message: 'must not be a reserved verb' })
      .brand<'OpExtraVerb'>(),
    args: fieldValuesContract,
  })
  .brand<'OpExtra'>();

export type OpExtra = z.infer<typeof opExtraContract>;
