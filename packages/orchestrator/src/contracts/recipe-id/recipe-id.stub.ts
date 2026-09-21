import { recipeIdContract } from './recipe-id-contract';
import type { RecipeId } from './recipe-id-contract';

export const RecipeIdStub = (
  { value }: { value: string } = { value: 'session-with-nested-chain' },
): RecipeId => recipeIdContract.parse(value);
