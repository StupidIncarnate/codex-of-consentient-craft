import { flowRecipeNameContract } from './flow-recipe-name-contract';
import type { FlowRecipeName } from './flow-recipe-name-contract';

export const FlowRecipeNameStub = (
  { value }: { value: string } = { value: 'pc-walk-1' },
): FlowRecipeName => flowRecipeNameContract.parse(value);
