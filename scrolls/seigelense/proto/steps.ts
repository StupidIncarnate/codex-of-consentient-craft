/**
 * The seed STEP: `params` discriminated by the `recipe` value, in-process.
 * Over the MCP wire this same union becomes a generated zod schema per recipe.
 */
import type { GuildId } from './ingredients';

/** Generated from the recipes the tool enumerated under packages/siegelense-recipes. */
export type RecipeInputs = {
  'guild-mid-execution': void;
  'session-with-nested-chain': { guildId: GuildId };
  'quest-advances-one-step': { questId: string };
};

type SeedStepFor<K extends keyof RecipeInputs> = RecipeInputs[K] extends void
  ? { step: 'seed'; recipe: K; params?: never; as?: string }
  : { step: 'seed'; recipe: K; params: RecipeInputs[K]; as?: string };

export type SeedStep = { [K in keyof RecipeInputs]: SeedStepFor<K> }[keyof RecipeInputs];

// ------------------------------------------------- positive

export const validBatch: SeedStep[] = [
  { step: 'seed', recipe: 'guild-mid-execution', as: 'g' },
  {
    step: 'seed',
    recipe: 'session-with-nested-chain',
    params: { guildId: 'g1' as GuildId },
    as: 's',
  },
];

// ------------------------------------------------- negative

export const missingParams: SeedStep[] = [
  // @ts-expect-error this recipe requires params
  { step: 'seed', recipe: 'session-with-nested-chain', as: 's' },
];

export const wrongParamShape: SeedStep[] = [
  // @ts-expect-error questId is not a param of this recipe
  { step: 'seed', recipe: 'session-with-nested-chain', params: { questId: 'q1' }, as: 's' },
];

export const paramsOnAParamlessRecipe: SeedStep[] = [
  // @ts-expect-error this recipe takes no params
  { step: 'seed', recipe: 'guild-mid-execution', params: { guildId: 'g1' }, as: 'g' },
];

export const unknownRecipe: SeedStep[] = [
  // @ts-expect-error not an enumerated recipe
  { step: 'seed', recipe: 'no-such-recipe', as: 'x' },
];
