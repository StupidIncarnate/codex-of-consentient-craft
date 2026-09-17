import type { StubArgument } from '@dungeonmaster/shared/@types';

import { recipesAnswerContract } from './recipes-answer-contract';
import type { RecipesAnswer } from './recipes-answer-contract';

export const RecipesAnswerStub = ({ ...props }: StubArgument<RecipesAnswer> = {}): RecipesAnswer =>
  recipesAnswerContract.parse({
    recipes: [],
    ...props,
  });
