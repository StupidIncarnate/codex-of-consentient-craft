import type { StubArgument } from '@dungeonmaster/shared/@types';

import { recipeContextContract } from './recipe-context-contract';
import type { RecipeContext } from './recipe-context-contract';

export const RecipeContextStub = ({ ...props }: StubArgument<RecipeContext> = {}): RecipeContext =>
  recipeContextContract.parse({
    apiBaseUrl: 'http://dungeonmaster.localhost:34172',
    homePath: '/tmp/dm-siege-inst_7f3a9c21',
    ...props,
  });
