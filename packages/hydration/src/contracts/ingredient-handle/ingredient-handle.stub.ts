import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ingredientHandleContract } from './ingredient-handle-contract';
import type { IngredientHandleData } from './ingredient-handle-contract';

export const IngredientHandleStub = ({
  ...props
}: StubArgument<IngredientHandleData> = {}): IngredientHandleData =>
  ingredientHandleContract.parse({
    ingredient: 'quest',
    ref: 'guild[0]/quest[0]',
    ...props,
  });
