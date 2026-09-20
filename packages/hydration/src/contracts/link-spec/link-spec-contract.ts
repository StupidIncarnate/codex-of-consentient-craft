/**
 * PURPOSE: One foreign key on a row — the parent's NAME, the field on THIS row carrying its id,
 * and (optionally) the field on the PARENT that id comes from. Reach for this over passing a
 * parent id by hand: the runner walks the plan depth-first and fills every one, so nothing else
 * may. A link names its parent by NAME, never by reference — a parent holding a reference to its
 * children while a child holds one back is an inference cycle, and TypeScript answers it with
 * `TS7022`, degrading every type downstream to `any`.
 *
 * `from` defaults to `'id'` when omitted — the runner, not this contract, applies that default,
 * so a parsed value with no `from` carries no `from` key at all (`exactOptionalPropertyTypes`).
 * Without it the mechanism only works for a parent whose own id field happens to be called `id`;
 * a session record with no `id` at all needs `from: 'sessionId'` to link at all.
 *
 * USAGE:
 * linkSpecContract.parse({ of: 'guild', as: 'guildId' });
 * linkSpecContract.parse({ of: 'session', as: 'sessionId', from: 'sessionId' });
 * // Returns { of: IngredientName, as: FieldName, from?: FieldName }
 */
import { z } from 'zod';
import { ingredientNameContract } from '../ingredient-name/ingredient-name-contract';
import { fieldNameContract } from '../field-name/field-name-contract';

export const linkSpecContract = z.object({
  of: ingredientNameContract,
  as: fieldNameContract,
  from: fieldNameContract.optional(),
});

export type LinkSpec = z.infer<typeof linkSpecContract>;

/**
 * `TParentName extends string`, not the branded `IngredientName` — a literal-preserving generic
 * parameter is what lets `registryCreateBroker`'s dangling-link check compare `of` against a
 * registered ingredient's own literal `name` instead of widening both sides to `string`. `from`
 * stays a bare optional `string`: the parent's own field names are not tracked by this generic,
 * only the child's `TFields` are.
 */
export interface LinkSpecFor<TFields, TParentName extends string> {
  of: TParentName;
  as: keyof TFields;
  from?: string;
}
