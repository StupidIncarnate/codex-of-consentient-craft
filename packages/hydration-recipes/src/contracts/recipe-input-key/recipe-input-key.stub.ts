import { recipeInputKeyContract } from './recipe-input-key-contract';
import type { RecipeInputKey } from './recipe-input-key-contract';

export const RecipeInputKeyStub = (
  { value }: { value: string } = { value: 'guildId' },
): RecipeInputKey => recipeInputKeyContract.parse(value);
