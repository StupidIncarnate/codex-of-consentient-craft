import { recipeManifestContract } from './recipe-manifest-contract';
import type { RecipeManifest } from './recipe-manifest-contract';
import { RecipeDefStub } from '../recipe-def/recipe-def.stub';

type RecipeManifestEntry = ReturnType<typeof RecipeDefStub>;

// A plain `{ value }` wrapper, not `StubArgument` — an object-rest destructure of an ARRAY
// parameter (`{...props}: StubArgument<T[]>`) copies only its index-keyed properties, never
// `.length`, so a length check against that rest object never sees a real override.
export const RecipeManifestStub = (
  { value }: { value: readonly RecipeManifestEntry[] } = { value: [RecipeDefStub()] },
): RecipeManifest => recipeManifestContract.parse(value);
