/**
 * PURPOSE: Names a plan and the inputs it needs, and hands back a callable that builds that plan as
 * DATA — nothing runs while it does. Reach for this over calling the chain directly: the name and
 * the description are what `recipes {}` prints, and the input schema is the one declaration that
 * serves the printed line, the in-process input type and a later `seed` step's wire validation.
 *
 * `build` is bundled into this ONE destructured parameter, alongside `name`/`description`/`inputs`,
 * rather than taken as a second positional argument the way the specification's own `recipe(meta,
 * build)` reads — `enforce-object-destructuring-params` refuses a second, non-destructured
 * parameter outright, and a callback cannot itself be destructured. `hydrationCreateBroker`'s bound
 * `recipe` property is what exposes the specification's literal two-argument shape: a plain object
 * property value never matches that rule's exported-arrow-function selector, so the adapter lives
 * there rather than here.
 *
 * `TInputSchema extends AnyRecipeInputSchema` is the real inference anchor, not `TInput` directly —
 * measured: a single-argument `z.ZodType<TInput>` parameter type defaults its own `_input` to
 * `TInput`, which rejects a branded schema (`z.object({ guildId: guildIdContract })`) the moment
 * `build`'s parameter carries an explicit annotation, exactly what every real recipe writes.
 * Anchoring on the SCHEMA and deriving `RecipeInputOf<TInputSchema>` downstream has no such
 * variance to violate. Omitting `inputs` leaves no inference candidate, so `TInputSchema` falls back
 * to `NoRecipeInputSchema`, and `RecipeInputOf<NoRecipeInputSchema>` is the paramless sentinel
 * `undefined` (never `void` — the lint rule refuses that in a bare `extends` position).
 *
 * USAGE:
 * // Through `hydrationCreateBroker`'s bound `recipe`, which supplies the two-argument sugar:
 * const guildMidExecution = recipe(
 *   { name: 'guild-mid-execution', description: 'one guild holding three quests' },
 *   () => [ ...ops ],
 * );
 * guildMidExecution(); // => Plan<Record<string, unknown>>
 */
import { recipeDefContract } from '../../../contracts/recipe-def/recipe-def-contract';
import type {
  RecipeDef,
  AnyRecipeInputSchema,
  NoRecipeInputSchema,
  RecipeInputOf,
} from '../../../contracts/recipe-def/recipe-def-contract';
import { hydrationPlanContract } from '../../../contracts/hydration-plan/hydration-plan-contract';
import type { Plan } from '../../../contracts/hydration-plan/hydration-plan-contract';
import type { HydrationOp } from '../../../contracts/hydration-op/hydration-op-contract';
import type { Op } from '../../../contracts/ingredient-handle/ingredient-handle-contract';

export const recipeDeclareBroker = <
  TName extends string,
  TInputSchema extends AnyRecipeInputSchema = NoRecipeInputSchema,
>({
  name,
  description,
  inputs,
  build,
}: {
  name: TName;
  description: string;
  inputs?: TInputSchema;
  build: (input: RecipeInputOf<TInputSchema>) => readonly Op[];
}): RecipeDef<TName, RecipeInputOf<TInputSchema>> => {
  const identity = recipeDefContract.parse({
    recipeName: name,
    description,
    ...(inputs === undefined ? {} : { inputs }),
  });

  return Object.assign(
    (input: RecipeInputOf<TInputSchema>): Plan<Record<string, unknown>> =>
      hydrationPlanContract.parse({
        recipeName: identity.recipeName,
        ops: build(input).flatMap((op) => op as unknown as readonly HydrationOp[]),
      }) as unknown as Plan<Record<string, unknown>>,
    identity,
  ) as unknown as RecipeDef<TName, RecipeInputOf<TInputSchema>>;
};
