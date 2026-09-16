/**
 * PURPOSE: One `seed` step in a batch — a recipe name, its params and the `as:` that names the
 * step's output. Reach for this over flattening the params onto the step: a recipe input named
 * `as`, `step` or `recipe` would shadow the step's own keys, and the collision would be silent.
 *
 * USAGE:
 * seedStepContract.parse({ step: 'seed', recipe: 'guild-mid-execution', as: 'g' });
 * // Returns SeedStepData, with no `params` key when the recipe takes none
 */
import { z } from 'zod';
import { recipeNameContract } from '../recipe-name/recipe-name-contract';

const seedStepParamKeyContract = z.string().min(1).brand<'SeedStepParamKey'>();
const seedStepAsContract = z.string().min(1).brand<'SeedStepAs'>();

export const seedStepContract = z.object({
  step: z.literal('seed'),
  recipe: recipeNameContract,
  params: z.record(seedStepParamKeyContract, z.unknown()).optional(),
  as: seedStepAsContract.optional(),
});

export type SeedStepData = z.infer<typeof seedStepContract>;

/**
 * `K extends keyof TInputs & string` is what keeps a wrong `recipe` key, a missing `params`, or
 * `params` on a paramless recipe compile errors. `TInputs` is the per-repo `RecipeInputs` map,
 * generated from `recipeManifestContract`'s entries — generating and owning that map is
 * siegelense's job, not this framework's. A paramless recipe's own entry is typed `undefined`,
 * not `void` — `@typescript-eslint/no-invalid-void-type` refuses `void` outside a return type or a
 * generic type argument, and `TInputs[K] extends void` is neither.
 */
export type SeedStepFor<TInputs, K extends keyof TInputs & string> = TInputs[K] extends undefined
  ? { step: 'seed'; recipe: K; params?: never; as?: string }
  : { step: 'seed'; recipe: K; params: TInputs[K]; as?: string };

export type SeedStep<TInputs> = {
  [K in keyof TInputs & string]: SeedStepFor<TInputs, K>;
}[keyof TInputs & string];
