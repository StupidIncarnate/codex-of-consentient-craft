import type { StubArgument } from '@dungeonmaster/shared/@types';

import { flowRecipeContract } from './flow-recipe-contract';
import type { FlowRecipe } from './flow-recipe-contract';

export const FlowRecipeStub = ({ ...props }: StubArgument<FlowRecipe> = {}): FlowRecipe =>
  flowRecipeContract.parse({
    id: 'pc-walk-1',
    instanceId: 'inst_7f3a9c21',
    runId: 'run_2',
    ...props,
  });
