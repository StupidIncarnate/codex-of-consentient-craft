/**
 * PURPOSE: Resolves and runs a recipe dynamically without statically importing
 * '@dungeonmaster/hydration-recipes'.
 *
 * A `seedResultContract.parse` failure is rewrapped naming the RECIPE and the parse detail —
 * `zodIssueErrorContract`, the same shape-detection `flagContractParseTransformer` uses for a bad
 * flag value, is what tells "this is the contract's own throw" apart from anything else — never a
 * raw ZodError issue array with no context a caller would otherwise have to read past.
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
import { zodIssueErrorContract } from '../../../contracts/zod-issue-error/zod-issue-error-contract';
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
  const seedRunExportName = recipesConventionStatics.exports.seed;
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

  try {
    return seedResultContract.parse(raw);
  } catch (error) {
    const zodIssueParse = zodIssueErrorContract.safeParse(error);
    if (!zodIssueParse.success) {
      throw error;
    }

    const detail = zodIssueParse.data.issues
      .map((issue) =>
        issue.path.length > 0 ? `${issue.path.join('.')}: ${issue.message}` : issue.message,
      )
      .join('; ');
    throw new Error(
      `recipe '${recipe}': its seed result did not match the expected shape — ${detail}`,
      {
        cause: error,
      },
    );
  }
};
