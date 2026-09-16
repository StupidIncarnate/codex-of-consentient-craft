/**
 * PURPOSE: The one thing the framework knows about any repo's own target — whether a server is
 * reachable. Reach for this as the CONSTRAINT on `createHydration<TTarget>`; the target's own
 * shape belongs to the repo, and the framework names neither files nor SQL.
 *
 * `Url` is declared here rather than imported from `@dungeonmaster/shared/contracts` — that
 * package exports no `Url` brand, only `urlSlugContract` (a kebab-case slug, a different value).
 * A repo's `baseUrl` needs a real URL brand, so this file is its home until a second consumer
 * outside this package asks for one.
 *
 * USAGE:
 * hydrationTargetContract.parse({});
 * hydrationTargetContract.parse({ baseUrl: 'http://localhost:3737' });
 * // Returns HydrationTarget
 */
import { z } from 'zod';
import type {
  IngredientConfig,
  IngredientConfigInferenceAnchor,
  Ingredient,
  ExtrasFree,
  Registry,
  NameOf,
  LinkNames,
} from '../ingredient-config/ingredient-config-contract';
import type { CopiesFor } from '../hydration-routes/hydration-routes-contract';
import type { Entry } from '../hydration-collection/hydration-collection-contract';
import type {
  RecipeDef,
  AnyRecipeInputSchema,
  NoRecipeInputSchema,
  RecipeInputOf,
} from '../recipe-def/recipe-def-contract';
import type { Op } from '../ingredient-handle/ingredient-handle-contract';

const urlContract = z.string().url().brand<'Url'>();

export type Url = z.infer<typeof urlContract>;

export const hydrationTargetContract = z.object({
  baseUrl: urlContract.optional(),
});

export type HydrationTarget = z.infer<typeof hydrationTargetContract>;

/**
 * What `hydrationCreateBroker<TTarget>()` hands back — one binding of the declaration surface to
 * a single repo's own target type. `ingredient` is bound to `TTarget` directly; `registry` and
 * `recipe` are target-agnostic (a declared ingredient's target is already erased behind its opaque
 * brand, and a plan's ops carry no target reference either), so both read exactly like their own
 * broker's signature. `run` is chunk 4's own ADDITIVE edit to this interface, not a member yet.
 */
export interface HydrationFor<TTarget extends HydrationTarget> {
  ingredient: <TFields extends object, const C extends IngredientConfig<TTarget, TFields>>(
    config: C &
      IngredientConfigInferenceAnchor<TFields> &
      CopiesFor<C['routes']> & { extras?: ExtrasFree<C['extras']> },
  ) => Ingredient<C>;
  registry: <R extends Registry>(
    entries: R &
      (LinkNames<R[keyof R]> extends NameOf<R[keyof R]>
        ? unknown
        : { LINK_NAMES_AN_UNREGISTERED_INGREDIENT: LinkNames<R[keyof R]> }),
  ) => Entry<R>;
  recipe: <TName extends string, TInputSchema extends AnyRecipeInputSchema = NoRecipeInputSchema>(
    meta: { name: TName; description: string; inputs?: TInputSchema },
    build: (input: RecipeInputOf<TInputSchema>) => readonly Op[],
  ) => RecipeDef<TName, RecipeInputOf<TInputSchema>>;
}
