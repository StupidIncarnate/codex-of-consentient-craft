/**
 * PURPOSE: The one field on an ingredient whose value is reached by WALKING rather than writing,
 * and the end states a caller may ask for. Reach for this over widening `fields` — `to` being
 * NARROWER than the field's own type is the point: a status nothing reaches by asking stays off
 * the list, and `set({ status: 'blocked' })` then refuses to compile. This file also exports
 * `ReachFn`, the function type that walks a row from one value to the other — see its own comment
 * for why it carries the row's `record`, not just the two values.
 *
 * USAGE:
 * transitionSpecContract.parse({ field: 'status', to: ['created', 'approved'] });
 * // Returns { field: FieldName, to: unknown[] }
 */
import { z } from 'zod';
import { fieldNameContract } from '../field-name/field-name-contract';

export const transitionSpecContract = z.object({
  field: fieldNameContract,
  to: z.array(z.unknown()).min(1),
});

export type TransitionSpec = z.infer<typeof transitionSpecContract>;

/**
 * The distributive mapped union: `field` and `to` are checked against the SAME key of the
 * ingredient's own fields, so `field: 'status', to: [1, 2]` cannot pass a `status` typed as a
 * string. This is what makes a mismatched `field`/`to` pair a compile error rather than a runtime
 * surprise.
 */
export type TransitionSpecFor<TFields> = {
  [K in keyof TFields]: { field: K; to: readonly TFields[K][] };
}[keyof TFields];

/**
 * What runs to get a row from its current value to the asked-for one. Kept out of the zod half —
 * a function has no shape a parse can compare — and intersected onto `transitions` at the
 * ingredient-config level instead.
 *
 * `record` is the ROW being walked — without it, `add(3, …)` gives `reach` no way to tell which
 * of the three rows it is being asked to move.
 */
export type ReachFn<TTarget, TValue> = (args: {
  from: TValue;
  to: TValue;
  target: TTarget;
  record: Record<string, unknown>;
}) => unknown;

/**
 * `TransitionSpecFor<TFields>` alone has no `reach` key — a function has no shape a parse can
 * compare, so it stays out of the zod-facing type. `ingredientConfigContract` needs the walked
 * field, its reachable values AND the function that walks it declared together, so this is the
 * distributive form `ingredient-config-contract.ts` intersects `reach` onto at the same key `to`
 * was checked against.
 */
export type TransitionSpecWithReachFor<TTarget, TFields> = {
  [K in keyof TFields]: {
    field: K;
    to: readonly TFields[K][];
    reach: ReachFn<TTarget, TFields[K]>;
  };
}[keyof TFields];
