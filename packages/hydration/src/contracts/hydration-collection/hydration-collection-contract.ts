/**
 * PURPOSE: A set of rows you may still `add` to — what a registry accessor and a child accessor
 * both are. Reach for `matchedSetContract` instead once the rows already exist: a filtered set
 * knows no count, so it carries no index and no `add`. The identity data is only which ingredient
 * this collection makes; `add`, `filter` and `under` arrive by intersection.
 *
 * `all` is `add`'s SECOND BUILDER ARGUMENT here, never a property beside the handle tuple —
 * measured across four candidate shapes: `Tuple<T, N> & { all: T }` (a plain intersection) and a
 * mapped-then-intersected version both let `q[3]` through after `add(3, …)`; a pure tuple and a
 * `{ rows, all }` wrapper both caught it. A second argument keeps the tuple pure and costs nothing.
 *
 * USAGE:
 * hydrationCollectionContract.parse({ ingredient: 'quest' });
 * // Returns HydrationCollectionData
 */
import { z } from 'zod';
import { ingredientNameContract } from '../ingredient-name/ingredient-name-contract';
import type { FilterExpect } from '../filter-expect/filter-expect-contract';
import type { FieldValuesFor } from '../field-values/field-values-contract';
import type {
  FieldsOf,
  Registry,
  AnyIngredient,
  UnderAncestor,
} from '../ingredient-config/ingredient-config-contract';
import type { Handle, Op, SavedOf } from '../ingredient-handle/ingredient-handle-contract';
import type { Matched } from '../matched-set/matched-set-contract';

export const hydrationCollectionContract = z.object({
  ingredient: ingredientNameContract,
});

export type HydrationCollectionData = z.infer<typeof hydrationCollectionContract>;

/**
 * A fixed-length tuple built from a LITERAL `N`. A widened `number` degrades to a plain array on
 * purpose — that degradation is what makes `q[3]` after `add(3, …)` a compile error only when `3`
 * stays a literal. The `const` modifier on a caller's count is unnecessary here: a type parameter
 * constrained `extends number` already infers the literal from a numeric-literal argument, and
 * `add` below declares none — keeping it would be harmless but misleading about why this works.
 */
export type Tuple<T, N extends number, R extends T[] = []> = number extends N
  ? T[]
  : R['length'] extends N
    ? R
    : Tuple<T, N, [...R, T]>;

export type Handles<R extends Registry, I, N extends number, Anc extends AnyIngredient[]> = Tuple<
  Handle<R, I, Anc>,
  N
>;

export interface FilterArgsFor<I> {
  where: FieldValuesFor<FieldsOf<I>>;
  /** Reuses the tool's own no-pick rule. Defaults to `'some'`; a zero match THROWS. */
  expect?: FilterExpect;
}

export interface Collection<R extends Registry, I, Anc extends AnyIngredient[] = []> {
  add: <N extends number, const Ops extends readonly Op<unknown>[]>(
    count: N,
    build: (rows: Handles<R, I, N, Anc>, all: Handle<R, I, Anc>) => Ops,
  ) => Op<SavedOf<Ops>>;
  /** No index access and no `add` on what comes back — the count is a RUN-TIME fact. */
  filter: (args: FilterArgsFor<I>) => Matched<I>;
  /**
   * Supplies a link from a recipe INPUT rather than from an ancestor. The ancestor chain a row minted
   * here carries forward grows by exactly the links `Ids` satisfies — never every link I declares
   * regardless of what was passed, which is what would let a child accessor appear where its links
   * are not really met. `UnderAncestor` is a name only: `under()` created no row, so nothing here
   * claims one exists.
   */
  under: <Ids extends FieldValuesFor<FieldsOf<I>>>(
    ids: Ids,
  ) => Collection<R, I, [...Anc, UnderAncestor<I, Ids>]>;
}

/** Entry points: one per registered ingredient that needs no ancestor. */
export type Entry<R extends Registry> = { [K in keyof R]: Collection<R, R[K]> };
