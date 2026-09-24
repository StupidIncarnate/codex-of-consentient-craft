import type { StubArgument } from '@dungeonmaster/shared/@types';

import { recipesScaffoldFileContract } from './recipes-scaffold-file-contract';
import type { RecipesScaffoldFile } from './recipes-scaffold-file-contract';

export const RecipesScaffoldFileStub = ({
  ...props
}: StubArgument<RecipesScaffoldFile> = {}): RecipesScaffoldFile =>
  recipesScaffoldFileContract.parse({
    relativePath: 'package.json',
    contents: '{}\n',
    ...props,
  });
