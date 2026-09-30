import type { FlowRecipe } from '../flow-recipe/flow-recipe-contract';
import { flowRecipeContract } from '../flow-recipe/flow-recipe-contract';

const flowRecipeNameContract = flowRecipeContract.shape.id;

export const FlowRecipeNameStub = (
  { value }: { value: string } = { value: 'pc-walk-1' },
): FlowRecipe['id'] => flowRecipeNameContract.parse(value);
