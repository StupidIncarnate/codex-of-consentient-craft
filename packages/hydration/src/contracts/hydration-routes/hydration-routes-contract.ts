/**
 * PURPOSE: How an ingredient's row actually gets made, as one function per route, with at least
 * one of `api`/`write` required. Reach for this over a route on the recipe — the
 * TARGET picks which route runs, which is what lets a caller with no server (a Jest integration
 * test) into the catalogue at all, so long as every ingredient it touches declares `write`.
 *
 * Three further OPTIONAL entries — `query`, `update`, `remove` — cover the chain verbs that reach
 * a row the plan did not just mint: `filter`'s query, `filter(…).set(…)`, a non-foldable `set`,
 * and `remove()`. They never count toward the at-least-one rule above, which is why the `.refine`
 * still iterates `hydrationRouteContract.options` rather than every key on this object — a plan
 * calling one of these three against an ingredient that declares no matching route is refused in
 * the pre-flight, by `HydrationRouteVerbUnavailableError`, not by this contract.
 *
 * USAGE:
 * hydrationRoutesContract.parse({ write: ({ target, fields }) => hydrate({ target, fields }) });
 * // Returns HydrationRoutes
 */
import { z } from 'zod';
import { hydrationRouteContract } from '../hydration-route/hydration-route-contract';

export type RouteFn<TTarget> = (args: {
  target: TTarget;
  fields: Record<string, unknown>;
}) => unknown;

/** A query is handed a MATCH OBJECT, never a full set of fields — `filter({ where })`'s `where`. */
export type QueryRouteFn<TTarget> = (args: {
  target: TTarget;
  where: Record<string, unknown>;
}) => unknown;

/** An update is handed the row it targets AND the values to write onto it. */
export type UpdateRouteFn<TTarget> = (args: {
  target: TTarget;
  record: Record<string, unknown>;
  fields: Record<string, unknown>;
}) => unknown;

/** A remove is handed the ROW it targets — neither fields nor a match object, because there is
 * nothing left to write once the row is gone. */
export type RemoveRouteFn<TTarget> = (args: {
  target: TTarget;
  record: Record<string, unknown>;
}) => unknown;

const routeFnContract = z.custom<RouteFn<unknown>>((value) => typeof value === 'function', {
  message: 'Expected a route function',
});

const queryRouteFnContract = z.custom<QueryRouteFn<unknown>>(
  (value) => typeof value === 'function',
  { message: 'Expected a query route function' },
);

const updateRouteFnContract = z.custom<UpdateRouteFn<unknown>>(
  (value) => typeof value === 'function',
  { message: 'Expected an update route function' },
);

const removeRouteFnContract = z.custom<RemoveRouteFn<unknown>>(
  (value) => typeof value === 'function',
  { message: 'Expected a remove route function' },
);

export const hydrationRoutesContract = z
  .object({
    api: routeFnContract.optional(),
    write: routeFnContract.optional(),
    query: queryRouteFnContract.optional(),
    update: updateRouteFnContract.optional(),
    remove: removeRouteFnContract.optional(),
  })
  .refine((routes) => hydrationRouteContract.options.some((route) => routes[route] !== undefined), {
    message: 'an ingredient must declare at least one route',
  });

export type HydrationRoutes = z.infer<typeof hydrationRoutesContract>;

/** The three verbs that reach a row a plan did not just mint. Every one is optional on every
 * ingredient — declaring none of them is legal, and a plan that needs one anyway is refused in
 * the pre-flight rather than here. */
interface ExistingRowRoutes<TTarget> {
  query?: QueryRouteFn<TTarget>;
  update?: UpdateRouteFn<TTarget>;
  remove?: RemoveRouteFn<TTarget>;
}

/**
 * At least one of the two MAKE routes, each optional. This union (rather than an object with
 * two optional keys) is what forces the compiler to refuse `routes: {}` — an object literal
 * typed against two optional keys satisfies both being absent, but none of this union's
 * two branches does. `ExistingRowRoutes` is intersected onto every branch equally, since
 * whether an ingredient can be queried, updated or removed has nothing to do with which MAKE
 * route it picked.
 */
export type RoutesFor<TTarget> = (
  | { api: RouteFn<TTarget>; write?: RouteFn<TTarget> }
  | { write: RouteFn<TTarget>; api?: RouteFn<TTarget> }
) &
  ExistingRowRoutes<TTarget>;

/** `copies:` is required exactly where a `write` route exists — never for an `api`-only
 * ingredient, which has nothing to imitate. Bare `string`, not the branded
 * `CopiesTarget`: a caller writes a plain literal here, and `ingredientConfigContract.parse` is
 * what brands it — same reasoning as `IngredientConfig.copies`, which this type is intersected
 * alongside at every `ingredientDeclareBroker` call site. */
export type CopiesFor<R> = R extends { write: RouteFn<never> }
  ? { copies: string }
  : { copies?: never };
