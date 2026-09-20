import type { StubArgument } from '@dungeonmaster/shared/@types';

import { recipeListingEntryContract } from './recipe-listing-entry-contract';
import type { RecipeListingEntry } from './recipe-listing-entry-contract';

export const RecipeListingEntryStub = ({
  ...props
}: StubArgument<RecipeListingEntry> = {}): RecipeListingEntry =>
  recipeListingEntryContract.parse({
    recipeName: 'guild-mid-execution',
    description: 'one guild holding three quests, the first running with its item dropped',
    inputKeys: [],
    runs: { serverless: true },
    makes: [{ ingredient: 'guild', count: 1 }],
    ...props,
  });
