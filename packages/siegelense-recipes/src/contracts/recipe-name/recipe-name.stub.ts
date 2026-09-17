import { recipeNameContract } from './recipe-name-contract';
import type { RecipeName } from './recipe-name-contract';

export const RecipeNameStub = (
  { value }: { value: string } = { value: 'guild-with-three-quests' },
): RecipeName => recipeNameContract.parse(value);
