import { ingredientNameContract } from './ingredient-name-contract';
import type { IngredientName } from './ingredient-name-contract';

export const IngredientNameStub = (
  { value }: { value: string } = { value: 'quest' },
): IngredientName => ingredientNameContract.parse(value);
