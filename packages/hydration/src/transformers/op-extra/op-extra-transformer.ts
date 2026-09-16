/**
 * PURPOSE: Builds the op for a verb only one ingredient could have — the row it targets, the verb's
 * own name, and the arguments the ingredient's `apply` will receive. This is the one op kind whose
 * verb is not fixed by the framework, unlike the other five which each dispatch to a single fixed
 * runner behaviour.
 *
 * USAGE:
 * opExtraTransformer({ ref: 'session[0:0]', verb: 'withNestedChain', args: { depth: 2 } });
 * // Returns { op: 'extra', ref: 'session[0:0]', verb: 'withNestedChain', args: { depth: 2 } }
 */
import { opExtraContract } from '../../contracts/op-extra/op-extra-contract';
import type { OpExtra } from '../../contracts/op-extra/op-extra-contract';
import type { RowRef } from '../../contracts/row-ref/row-ref-contract';
import type { ExtraVerbName } from '../../contracts/extra-verb-name/extra-verb-name-contract';
import type { FieldValues } from '../../contracts/field-values/field-values-contract';

export const opExtraTransformer = ({
  ref,
  verb,
  args,
}: {
  ref: RowRef;
  verb: ExtraVerbName;
  args: FieldValues;
}): OpExtra => opExtraContract.parse({ op: 'extra', ref, verb, args });
