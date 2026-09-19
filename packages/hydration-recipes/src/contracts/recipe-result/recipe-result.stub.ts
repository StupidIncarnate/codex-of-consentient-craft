import type { StubArgument } from '@dungeonmaster/shared/@types';

import { recipeResultContract } from './recipe-result-contract';
import type { RecipeResult } from './recipe-result-contract';

export const RecipeResultStub = ({ ...props }: StubArgument<RecipeResult> = {}): RecipeResult =>
  recipeResultContract.parse({
    guildId: '7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41',
    guildSlug: 'siege-guild',
    ...props,
  });
