import type { FlowRecipe } from '../flow-recipe/flow-recipe-contract';
import { flowRecipeContract } from '../flow-recipe/flow-recipe-contract';

export const FlowRecipeNameStub = (
  { value }: { value: string } = { value: 'pc-walk-1' },
): FlowRecipe['id'] => flowRecipeContract.shape.id.parse(value);
