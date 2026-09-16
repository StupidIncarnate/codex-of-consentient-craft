/**
 * PURPOSE: What `recipe()` hands back — a callable carrying its own name, its one-line description
 * and its input schema. Reach for the schema on this over a second copy anywhere: the listing
 * prints it, the in-process input type infers off it via `z.infer`, and siegelense's wire
 * validation parses `params` against it.
 *
 * USAGE:
 * recipeDefContract.parse({ recipeName: 'guild-mid-execution', description: 'one guild' });
 * // Returns RecipeDefData
 */
import { z } from 'zod';
import { recipeNameContract } from '../recipe-name/recipe-name-contract';
import type { Plan } from '../hydration-plan/hydration-plan-contract';

const recipeDescriptionContract = z.string().min(1).brand<'RecipeDescription'>();

// The schema itself, not its shape — `z.custom` with no type argument (so it infers `unknown`)
// hands the same reference back rather than expanding a `ZodTypeAny`'s own methods through
// `StubArgument`.
const zodSchemaContract = z.custom((value) => value instanceof z.ZodType, {
  message: 'Expected a zod schema',
});

export const recipeDefContract = z.object({
  recipeName: recipeNameContract,
  description: recipeDescriptionContract,
  inputs: zodSchemaContract.optional(),
});

export type RecipeDefData = z.infer<typeof recipeDefContract>;

/**
 * The callable a build agent actually gets back from `recipe()`. `inputs` and the call signature's
 * `TInput` are typed generically here — richer than `RecipeDefData['inputs']`, which stays
 * `unknown` because this generic layer cannot know any one recipe's own input shape.
 */
export type RecipeDef<TName extends string, TInput> = Omit<
  RecipeDefData,
  'recipeName' | 'inputs'
> & {
  (input: TInput): Plan<Record<string, unknown>>;
  recipeName: TName;
  inputs?: z.ZodType<TInput>;
};
