/**
 * PURPOSE: Declares one ingredient — its identity, its two contracts, its routes and whatever it
 * opts into — and is the single place a malformed declaration is refused. Reach for this over
 * building a config object and handing it straight to a registry: nine of the ten malformed
 * declarations are compile errors through this function's own generic signature, and the three a
 * caller could still reach from plain JavaScript (no routes at all, a `write` route with nothing to
 * compare against, an extra shadowing a verb the framework already owns) are refused here by name,
 * so a consumer that skipped the typechecker gets the same refusal TypeScript would have given it.
 *
 * USAGE:
 * // Through `hydrationCreateBroker`'s bound `ingredient`, once it exists — see this file's own
 * // parameter-type comment for the fully explicit form a direct caller needs today.
 * const quest = ingredient({
 *   name: 'quest',
 *   description: 'one quest under a guild, at whatever status you set it to',
 *   fields: questFieldsContract,
 *   record: questRecordContract,
 *   routes: { write: ({ target, fields }) => hydrate({ target, fields }) },
 *   copies: 'questPersistBroker',
 * });
 * // Returns an opaque Ingredient token — its properties are read only through ConfigOf et al.
 */
import { ingredientConfigContract } from '../../../contracts/ingredient-config/ingredient-config-contract';
import type {
  IngredientConfig,
  IngredientConfigInferenceAnchor,
  Ingredient,
  ExtrasFree,
} from '../../../contracts/ingredient-config/ingredient-config-contract';
import type { CopiesFor } from '../../../contracts/hydration-routes/hydration-routes-contract';
import { reservedVerbStatics } from '../../../statics/reserved-verb/reserved-verb-statics';
import { IngredientDeclarationError } from '../../../errors/ingredient-declaration/ingredient-declaration-error';

export const ingredientDeclareBroker = <
  TTarget,
  TFields extends object,
  TName extends string,
  const C extends IngredientConfig<TTarget, TFields, TName>,
>({
  ...config
}: C &
  // `TFields`/`TName` appear only inside C's own constraint otherwise, which is too deep for the
  // compiler to infer through — this anchor gives each one a direct top-level site. `TTarget` has
  // no such anchor: it sits inside `RoutesFor<TTarget>`, a three-branch union over WHICH route is
  // required, in a contravariant (function-parameter) position, and the compiler does not invert
  // that combination to solve a free type parameter — nor does defaulting `TFields`/`TName`/`C` so
  // `TTarget` alone could be given explicitly help, because a call here refuses ANY partial explicit
  // type-argument list (`TS2558`) whether or not the rest have defaults. A caller of this broker
  // directly (there is no `createHydration<TTarget>()` yet to bind it once) supplies all four type
  // arguments explicitly — `ingredientDeclareBroker<DmTarget, TFields, C['name'], C>(config)` — or,
  // as `test/type-fixtures/dm-target.ts` and `sql-target.ts` do, wraps this in a small target-bound
  // helper that makes that one fully-saturated call once, so every individual ingredient
  // declaration still reads like the spec's own un-annotated examples.
  IngredientConfigInferenceAnchor<TFields, TName> &
  CopiesFor<C['routes']> & { extras?: ExtrasFree<C['extras']> }): Ingredient<C> => {
  // Runtime backstop for the three rules the type system enforces only when a caller typechecked
  // at all — D3, D4, D5/D6 in the malformed-declarations table. D1, D2, D7 and D8 have no runtime
  // counterpart here: this generic layer never sees TFields' concrete keys at run time, only at the
  // type level, so `transitions.field`, `defaults` and `links.as` are refused by the compiler alone.
  const declaresARoute =
    config.routes.api !== undefined ||
    config.routes.write !== undefined ||
    config.routes.recording !== undefined;
  if (!declaresARoute) {
    throw new IngredientDeclarationError({
      ingredientName: config.name,
      reason: 'declares no routes',
    });
  }

  if (config.routes.write !== undefined && config.copies === undefined) {
    throw new IngredientDeclarationError({
      ingredientName: config.name,
      reason: "declares a 'write' route and must declare 'copies'",
    });
  }

  const reservedVerbs: readonly string[] = reservedVerbStatics.verbs;
  const extraNames = config.extras === undefined ? [] : Object.keys(config.extras);
  const shadowedVerb = extraNames.find((verb) => reservedVerbs.includes(verb));
  if (shadowedVerb !== undefined) {
    throw new IngredientDeclarationError({
      ingredientName: config.name,
      reason: `declares an extra named '${shadowedVerb}', which the framework already owns`,
    });
  }

  const parsed = ingredientConfigContract.parse(config);
  return parsed as unknown as Ingredient<C>;
};
