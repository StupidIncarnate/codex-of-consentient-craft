/**
 * PURPOSE: Resolves and runs a recipe dynamically without statically importing
 * '@dungeonmaster/siegelense-recipes'.
 *
 * USAGE:
 * await recipeSeedRunBroker({ recipe, apiBaseUrl, homePath, parameters });
 */

import { runtimeDynamicImportAdapter } from '@dungeonmaster/shared/adapters';
import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';
import { recipesConventionStatics } from '@dungeonmaster/shared/statics';

import type { RecipeName } from '../../../contracts/recipe-name/recipe-name-contract';
import {
  seedResultContract,
  type SeedResult,
} from '../../../contracts/seed-result/seed-result-contract';
import { RecipesListingExportInvalidError } from '../../../errors/recipes-listing-export-invalid/recipes-listing-export-invalid-error';
import { recipesLocateBroker } from '../../recipes/locate/recipes-locate-broker';

export const recipeSeedRunBroker = async ({
  recipe,
  apiBaseUrl,
  homePath,
  parameters,
}: {
  recipe: RecipeName;
  apiBaseUrl: ContentText;
  homePath: AbsoluteFilePath;
  parameters: Record<string, ContentText>;
}): Promise<SeedResult> => {
  const entryPath = await recipesLocateBroker();
  const recipesModule = await runtimeDynamicImportAdapter({ path: entryPath });
  const seedRunExportName = recipesConventionStatics.exports.seedRun;
  const seedRunExport =
    typeof recipesModule === 'object' && recipesModule !== null
      ? (recipesModule as Record<PropertyKey, unknown>)[seedRunExportName]
      : undefined;

  if (typeof seedRunExport !== 'function') {
    throw new RecipesListingExportInvalidError({
      entryPath,
      exportName: seedRunExportName,
      found: typeof seedRunExport,
    });
  }

  const seedRun = seedRunExport as (params: unknown) => Promise<unknown>;
  const raw = await seedRun({
    recipeName: recipe,
    params: parameters,
    home: homePath,
    baseUrl: apiBaseUrl,
  });

  return seedResultContract.parse(raw);
};
