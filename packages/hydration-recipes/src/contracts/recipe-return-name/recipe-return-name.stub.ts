import { recipeReturnNameContract } from './recipe-return-name-contract';
import type { RecipeReturnName } from './recipe-return-name-contract';

export const RecipeReturnNameStub = (
  { value }: { value: string } = { value: 'guildSlug' },
): RecipeReturnName => recipeReturnNameContract.parse(value);
