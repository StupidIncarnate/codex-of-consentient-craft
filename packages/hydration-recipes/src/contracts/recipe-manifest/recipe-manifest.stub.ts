import type { StubArgument } from '@dungeonmaster/shared/@types';

import { recipeManifestContract } from './recipe-manifest-contract';
import type { RecipeManifest } from './recipe-manifest-contract';

export const RecipeManifestStub = ({
  ...props
}: StubArgument<RecipeManifest> = {}): RecipeManifest =>
  recipeManifestContract.parse({
    name: 'guild-with-three-quests',
    produces: 'one guild holding three quests, one in_progress',
    fidelity: 'production',
    mirrors: null,
    parameters: [],
    returns: [{ name: 'guildId', description: 'the seeded guild' }],
    ...props,
  });
