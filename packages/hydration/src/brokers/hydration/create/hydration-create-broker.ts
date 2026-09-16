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
 * The returned object is cast through `unknown` to the named `HydrationFor<TTarget>` rather than
 * left to structural inference — `exactOptionalPropertyTypes` refuses two independently-elaborated
 * (but textually identical) generic intersections as reflexively assignable, measured against this
 * exact shape, so the cast is the mechanism, matching every chain transformer's own `as unknown as`
 * return.
 *
 * USAGE:
 * const { ingredient, registry, recipe } = hydrationCreateBroker<DmTarget>();
 * const quest = ingredient({ name: 'quest', description: '…', fields, record, routes, copies: 'x' });
 * const dm = registry({ quests: quest });
 * const guildMidExecution = recipe({ name: 'guild-mid-execution', description: '…' }, () => [ops]);
 */
import { ingredientDeclareBroker } from '../../ingredient/declare/ingredient-declare-broker';
import { registryCreateBroker } from '../../registry/create/registry-create-broker';
import { recipeDeclareBroker } from '../../recipe/declare/recipe-declare-broker';
import type {
  HydrationTarget,
  HydrationFor,
} from '../../../contracts/hydration-target/hydration-target-contract';
import type {
  IngredientConfig,
  IngredientConfigInferenceAnchor,
  Ingredient,
  ExtrasFree,
} from '../../../contracts/ingredient-config/ingredient-config-contract';
import type { CopiesFor } from '../../../contracts/hydration-routes/hydration-routes-contract';
import type {
  RecipeDef,
  AnyRecipeInputSchema,
  NoRecipeInputSchema,
  RecipeInputOf,
} from '../../../contracts/recipe-def/recipe-def-contract';
import type { Op } from '../../../contracts/ingredient-handle/ingredient-handle-contract';

export const hydrationCreateBroker = <TTarget extends HydrationTarget>(): HydrationFor<TTarget> =>
  ({
    ingredient: <TFields extends object, const C extends IngredientConfig<TTarget, TFields>>(
      config: C &
        IngredientConfigInferenceAnchor<TFields> &
        CopiesFor<C['routes']> & { extras?: ExtrasFree<C['extras']> },
    ): Ingredient<C> => ingredientDeclareBroker<TTarget, TFields, C['name'], C>(config),
    registry: registryCreateBroker,
    recipe: <TName extends string, TInputSchema extends AnyRecipeInputSchema = NoRecipeInputSchema>(
      meta: { name: TName; description: string; inputs?: TInputSchema },
      build: (input: RecipeInputOf<TInputSchema>) => readonly Op[],
    ): RecipeDef<TName, RecipeInputOf<TInputSchema>> => recipeDeclareBroker({ ...meta, build }),
  }) as unknown as HydrationFor<TTarget>;
