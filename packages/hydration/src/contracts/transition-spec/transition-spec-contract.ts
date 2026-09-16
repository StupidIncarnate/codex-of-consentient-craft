/**
 * PURPOSE: The one field on an ingredient whose value is reached by WALKING rather than writing,
 * the end states a caller may ask for, and the function that walks it. Reach for this over
 * widening `fields` — `to` being NARROWER than the field's own type is the point: a status nothing
 * reaches by asking stays off the list, and `set({ status: 'blocked' })` then refuses to compile.
 * `reach` is checked the same way `hydrationRoutesContract` checks a route function — `z.custom`
 * against "is it callable", with the generic SET to the function type itself. A function has no
 * enumerable keys for `StubArgument`'s object-property expansion to trip over (unlike the schema
 * values `fields`/`record`/`extras.args` carry, which is why THOSE stay untyped `z.custom`), so
 * setting the generic here costs nothing and is what lets a caller's real `reach` survive this
 * contract's `.parse()` instead of vanishing as an unrecognized key — the defect this contract used
 * to have. The precise per-target, per-field signature still comes only from
 * `TransitionSpecWithReachFor`'s intersection at the ingredient-config level, exactly as
 * `RoutesFor<TTarget>` supplies the real per-route signature over `hydrationRoutesContract`'s own
 * generic function check.
 *
 * USAGE:
 * transitionSpecContract.parse({
 *   field: 'status',
 *   to: ['created', 'approved'],
 *   reach: ({ from, to, target, record }) => walk({ from, to, target, record }),
 * });
 * // Returns { field: FieldName, to: unknown[], reach: ReachFn<unknown, unknown> }
 */
import { z } from 'zod';
import { fieldNameContract } from '../field-name/field-name-contract';

/**
 * What runs to get a row from its current value to the asked-for one.
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

const reachFnContract = z.custom<ReachFn<unknown, unknown>>(
  (value) => typeof value === 'function',
  {
    message: 'Expected a reach function',
  },
);

export const transitionSpecContract = z.object({
  field: fieldNameContract,
  to: z.array(z.unknown()).min(1),
  reach: reachFnContract,
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
 * `transitionSpecContract`'s own `reach` field only proves "some function" at parse time — `reach`
 * there is typed generically (`ReachFn<unknown, unknown>`), the same way `hydrationRoutesContract`
 * types a route generically. This is the distributive form `ingredient-config-contract.ts`
 * intersects onto `transitions` instead, at the same key `to` was checked against, so `reach` gets
 * the ingredient's REAL `TTarget` and the walked field's real value type.
 */
export type TransitionSpecWithReachFor<TTarget, TFields> = {
  [K in keyof TFields]: {
    field: K;
    to: readonly TFields[K][];
    reach: ReachFn<TTarget, TFields[K]>;
  };
}[keyof TFields];
