import type { StubArgument } from '@dungeonmaster/shared/@types';

import { recipesArgsContract } from './recipes-args-contract';
import type { RecipesArgs } from './recipes-args-contract';

export const RecipesArgsStub = ({ ...props }: StubArgument<RecipesArgs> = {}): RecipesArgs =>
  recipesArgsContract.parse({
    isJson: true,
    ...props,
  });
