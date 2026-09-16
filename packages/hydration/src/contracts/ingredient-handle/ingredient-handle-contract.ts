/**
 * PURPOSE: One row the chain will make, and every verb that may be called on it — `set`, `setRaw`,
 * `saveRecordAs`, `remove`, that ingredient's own extras, and a collection for each child whose
 * links this row's ancestry satisfies. Reach for this over a record: nothing has been created when
 * the builder runs, so `q[0].id` is not readable and must not be made so — only `ingredient` and
 * `ref`, this row's build-time identity, exist yet. The verb surface arrives by intersection, the
 * same mixed-data-and-function pattern `eslintContextContract` already uses in this repo.
 *
 * Every verb returns the opaque `Op`, never the concrete `HydrationOp` union: a single chain call
 * can stand for many real op-tree nodes (`all.set(...)` broadcasts across every row an `add` just
 * minted), and only an opaque brand lets the type system treat that call as ONE thing without
 * claiming to know how many nodes it becomes — the same reason `proto/hydration.ts` kept `Op` fully
 * opaque rather than typing it against any one op shape.
 *
 * USAGE:
 * ingredientHandleContract.parse({ ingredient: 'quest', ref: 'guild[0:0]/quest[0:2]' });
 * // Returns IngredientHandleData
 */
import { z } from 'zod';
import { ingredientNameContract } from '../ingredient-name/ingredient-name-contract';
import { rowRefContract } from '../row-ref/row-ref-contract';
import type { FieldValuesFor } from '../field-values/field-values-contract';
import type {
  ConfigOf,
  FieldsOf,
  NameOf,
  LinkNames,
  Registry,
  AnyIngredient,
} from '../ingredient-config/ingredient-config-contract';
import type { Collection } from '../hydration-collection/hydration-collection-contract';

export const ingredientHandleContract = z.object({
  ingredient: ingredientNameContract,
  ref: rowRefContract,
});

export type IngredientHandleData = z.infer<typeof ingredientHandleContract>;

declare const OP: unique symbol;
/** One node of the plan tree, opaque at the chain's own type surface. Distinct from
 * `HydrationOp` (the concrete six-member union `hydration-op-contract.ts` validates) on purpose —
 * see the file PURPOSE above. */
export interface Op {
  readonly [OP]: true;
}

type TransitionField<I> = ConfigOf<I> extends { transitions: { field: infer F } } ? F : never;
type TransitionTo<I> =
  ConfigOf<I> extends { transitions: { to: readonly (infer V)[] } } ? V : never;

/**
 * A plain field keeps `F[K] | SavedRef` — Q3's ruling, so a cross-link compiles with no `as never`.
 * A TRANSITION field narrows instead to the end states the ingredient declared, which is how
 * `set({ status })` is enforced per ingredient and why a transition needs no verb of its own. The
 * transition branch does NOT admit a `SavedRef`: `NonNullable<Settable<Quest>['status']>` must stay
 * exactly the declared `to` union, one of the six SHAPE assertions group E's positive tree proves.
 */
export type Settable<I> = [TransitionField<I>] extends [never]
  ? FieldValuesFor<FieldsOf<I>>
  : FieldValuesFor<Omit<FieldsOf<I>, TransitionField<I> & keyof FieldsOf<I>>> &
      Partial<Record<TransitionField<I> & keyof FieldsOf<I>, TransitionTo<I>>>;

export interface RowVerbs<I> {
  set: (values: Settable<I>) => Op;
  /** Writes a transition field and walks NOTHING. The deliberate odd one — nobody reaches for it
   * by accident, so its argument stays a plain `Partial<FieldsOf<I>>` with no `SavedRef`. */
  setRaw: (values: Partial<FieldsOf<I>>) => Op;
  /** The whole RECORD, not only its ids — server-assigned fields included. */
  saveRecordAs: (args: { name: string }) => Op;
  remove: () => Op;
}

/**
 * Each `extras` entry is now `{ args, apply }`, not a bare argument contract — reading the args
 * type means narrowing through the `args` property, never the entry itself.
 */
export type ExtraMethods<I> =
  ConfigOf<I> extends { extras: infer E }
    ? { [K in keyof E]: (args: E[K] extends { args: z.ZodType<infer A> } ? A : never) => Op }
    : Record<PropertyKey, never>;

type AncestorNames<Anc extends AnyIngredient[]> = NameOf<Anc[number]>;

/**
 * A child accessor exists ONLY where BOTH hold: the host is named in the child's own `links`, AND
 * every one of the child's links is satisfied by something already in the ancestor chain. Measured:
 * dropping the second condition alone puts `sessions` on a quest, because a quest's ancestors
 * include a guild that alone cannot supply every link `sessions` names — condition 2 alone gets the
 * SECOND case wrong, not the first.
 */
export type ChildAccessors<R extends Registry, Host, Anc extends AnyIngredient[]> = {
  [K in keyof R as [LinkNames<R[K]>] extends [never]
    ? never
    : NameOf<Host> extends LinkNames<R[K]>
      ? LinkNames<R[K]> extends AncestorNames<Anc>
        ? K
        : never
      : never]: Collection<R, R[K], Anc>;
};

export type Handle<R extends Registry, I, Anc extends AnyIngredient[]> = RowVerbs<I> &
  ExtraMethods<I> &
  ChildAccessors<R, I, [I & AnyIngredient, ...Anc]>;
