/**
 * PURPOSE: Instantiates the framework once for one repo's own TARGET type, and is the only place
 * that type is named. Reach for this at the top of a recipes package; the framework itself names
 * neither files nor SQL, and every ingredient it declares shares this one binding instead of each
 * repeating `ingredientDeclareBroker<TTarget, TFields, C['name'], C>(config)` by hand.
 *
 * `recipe` is where the specification's literal two-argument call — `recipe({ name, description,
 * inputs? }, build)` — actually lives. `recipeDeclareBroker`'s own parameter bundles `build` into
 * ONE destructured object, because `enforce-object-destructuring-params` refuses a second,
 * non-destructured parameter; a plain object PROPERTY value never matches that rule's
 * exported-arrow-function selector, so the two-argument sugar is adapted here instead, calling
 * `recipeDeclareBroker` with `build` folded back onto `meta`.
 *
 * `registry`'s own inline signature stays loose (`Registry`, not the phantom-property intersection
 * `registryCreateBroker` itself carries) and its result is cast rather than re-verified: redeclaring
 * that self-referential conditional type here — on top of capturing `entries` for `run` — produced a
 * genuine `R & (...)` generic mismatch TypeScript could not resolve. The outer `as unknown as
 * HydrationFor<TTarget>` is what every caller actually sees, so the full phantom-property check
 * still applies to `dm.registry(...)` from outside this file; only this file's OWN internal
 * plumbing is loosely typed.
 *
 * The returned object is cast through `unknown` to the named `HydrationFor<TTarget>` rather than
 * left to structural inference — `exactOptionalPropertyTypes` refuses two independently-elaborated
 * (but textually identical) generic intersections as reflexively assignable, measured against this
 * exact shape, so the cast is the mechanism, matching every chain transformer's own `as unknown as`
 * return.
 *
 * `listing` folds `planRunsTransformer` and `planMakesTransformer` over one plan, reading the same
 * `registeredIngredients` closure `run` already reads (D1) rather than asking every caller to hand
 * its own ingredient list back in — a declared ingredient is opaque outside this file, so nothing
 * else holds that list to pass.
 *
 * USAGE:
 * const { ingredient, registry, recipe, run, listing } = hydrationCreateBroker<DmTarget>();
 * const quest = ingredient({ name: 'quest', description: '…', fields, record, routes, copies: 'x' });
 * const dm = registry({ quests: quest });
 * const guildMidExecution = recipe({ name: 'guild-mid-execution', description: '…' }, () => [ops]);
 * await run(guildMidExecution(), { home });
 * const { runs, makes } = listing(guildMidExecution());
 */
import { ingredientDeclareBroker } from '../../ingredient/declare/ingredient-declare-broker';
import { registryCreateBroker } from '../../registry/create/registry-create-broker';
import { recipeDeclareBroker } from '../../recipe/declare/recipe-declare-broker';
import { planRunBroker } from '../../plan/run/plan-run-broker';
import { planRunsTransformer } from '../../../transformers/plan-runs/plan-runs-transformer';
import { planMakesTransformer } from '../../../transformers/plan-makes/plan-makes-transformer';
import type {
  HydrationTarget,
  HydrationFor,
} from '../../../contracts/hydration-target/hydration-target-contract';
import type {
  IngredientConfig,
  IngredientConfigInferenceAnchor,
  Ingredient,
  ExtrasFree,
  Registry,
  IngredientConfigData,
} from '../../../contracts/ingredient-config/ingredient-config-contract';
import type { CopiesFor } from '../../../contracts/hydration-routes/hydration-routes-contract';
import type {
  RecipeDef,
  AnyRecipeInputSchema,
  NoRecipeInputSchema,
  RecipeInputOf,
} from '../../../contracts/recipe-def/recipe-def-contract';
import type { Op, SavedOf } from '../../../contracts/ingredient-handle/ingredient-handle-contract';
import type {
  HydrationPlan,
  Plan,
} from '../../../contracts/hydration-plan/hydration-plan-contract';
import type { HydrationRunResult } from '../../../contracts/hydration-run-result/hydration-run-result-contract';
import type { PlanRunsResult } from '../../../contracts/plan-runs-result/plan-runs-result-contract';
import type { PlanMakesEntry } from '../../../contracts/plan-makes-entry/plan-makes-entry-contract';

export const hydrationCreateBroker = <TTarget extends HydrationTarget>(): HydrationFor<TTarget> => {
  // D1: `run` reads whatever ingredients THIS binding's own `registry()` call was handed, so the
  // lookup a plan's ops resolve against is total by construction rather than passed by hand.
  let registeredIngredients: readonly IngredientConfigData[] = [];

  return {
    ingredient: <TFields extends object, const C extends IngredientConfig<TTarget, TFields>>(
      config: C &
        IngredientConfigInferenceAnchor<TFields> &
        CopiesFor<C['routes']> & { extras?: ExtrasFree<C['extras']> },
    ): Ingredient<C> => ingredientDeclareBroker<TTarget, TFields, C['name'], C>(config),
    registry: (entries: Registry) => {
      registeredIngredients = Object.values(entries).map(
        (token) => token as unknown as IngredientConfigData,
      );
      return registryCreateBroker(entries as never);
    },
    recipe: <
      TName extends string,
      TInputSchema extends AnyRecipeInputSchema = NoRecipeInputSchema,
      const Ops extends readonly Op<unknown>[] = readonly Op<unknown>[],
    >(
      meta: { name: TName; description: string; inputs?: TInputSchema },
      build: (input: RecipeInputOf<TInputSchema>) => Ops,
    ): RecipeDef<TName, RecipeInputOf<TInputSchema>, SavedOf<Ops>> =>
      recipeDeclareBroker({ ...meta, build }),
    run: async <TOut = HydrationRunResult>(
      plan: Plan<TOut> | HydrationPlan,
      target: TTarget,
    ): Promise<TOut> =>
      (await planRunBroker({ plan, target, ingredients: registeredIngredients })) as TOut,
    listing: (plan: HydrationPlan): { runs: PlanRunsResult; makes: readonly PlanMakesEntry[] } => ({
      runs: planRunsTransformer({ plan, ingredients: registeredIngredients }),
      makes: planMakesTransformer({ plan }),
    }),
  } as unknown as HydrationFor<TTarget>;
};
