import type { StubArgument } from '@dungeonmaster/shared/@types';
import { recipeDefContract } from './recipe-def-contract';
import type { RecipeDefData } from './recipe-def-contract';

export const RecipeDefStub = ({ ...props }: StubArgument<RecipeDefData> = {}): RecipeDefData =>
  recipeDefContract.parse({
    recipeName: 'guild-mid-execution',
    description: 'one guild holding three quests, the first running with its item dropped',
    ...props,
  });
