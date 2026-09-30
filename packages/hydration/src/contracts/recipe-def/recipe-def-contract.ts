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
import { z } from '#gateway/npm/zod';
import type { Plan } from '../hydration-plan/hydration-plan-contract';

const recipeDescriptionContract = z.string().min(1).brand<'RecipeDescription'>();

// The schema itself, not its shape — `z.custom` with no type argument (so it infers `unknown`)
// hands the same reference back rather than expanding a `ZodTypeAny`'s own methods through
// `StubArgument`.
const zodSchemaContract = z.custom((value) => value instanceof z.ZodType, {
  message: 'Expected a zod schema',
});

export const recipeDefContract = z.object({
  recipeName: z.string().min(1).brand<'RecipeDefRecipeName'>(),
  description: recipeDescriptionContract,
  inputs: zodSchemaContract.optional(),
});

export type RecipeDefData = z.infer<typeof recipeDefContract>;

/**
 * The callable a build agent actually gets back from `recipe()`. `inputs` and the call signature's
 * `TInput` are typed generically here — richer than `RecipeDefData['inputs']`, which stays
 * `unknown` because this generic layer cannot know any one recipe's own input shape.
 *
 * The call signature's own parameter is optional exactly when `TInput` is the paramless sentinel
 * `undefined`, never otherwise — measured: TypeScript refuses `f()` against a REQUIRED parameter
 * typed exactly `undefined` (`Expected 1 arguments, but got 0`), so a plain `(input: TInput)` would
 * make the specification's own zero-argument call — `const plan = guildMidExecution();` — a
 * compile error for every recipe declared with no `inputs`. `(input?: TInput)` fixes the paramless
 * branch while a real input type keeps its parameter required, which is what still refuses row
 * 13's negative case — a recipe declared WITH `inputs` called with none.
 */
export type RecipeDef<TName extends string, TInput, TOut = Record<string, unknown>> = Omit<
  RecipeDefData,
  'recipeName' | 'inputs'
> &
  (TInput extends undefined ? (input?: TInput) => Plan<TOut> : (input: TInput) => Plan<TOut>) & {
    recipeName: TName;
    inputs?: z.ZodType<TInput>;
  };

/** `z.infer` over a recipe's input schema. The constraint is bare `z.ZodType` (zod's broadest schema
 * type), the one a caller's REAL schema value infers against with no `_input`/`_output` variance
 * mismatch; `z.ZodType<TInput>` instead — one type argument, so `_input` defaults to `TInput` itself
 * — rejects a branded schema (`z.object({ guildId: guildIdContract })`) the moment `build`'s own
 * parameter carries an explicit annotation, which every real recipe's builder does. */
export type RecipeInputOf<TInputSchema extends z.ZodType> = z.infer<TInputSchema>;
