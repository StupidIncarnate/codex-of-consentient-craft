/**
 * PURPOSE: The `seed` step's own verb broker. Refuses what siegelense can see off the recipes
 * listing alone — an unknown recipe name, params handed to a recipe whose `inputKeys` is empty, a
 * params key the listing does not name, or a declared key the listing names that `params` never
 * supplies — before importing anything that writes, then dynamically imports the recipes package's
 * own `RecipesSeedResponder` export and runs it against the lane's home and base URL. A recipe's own
 * `inputs` schema is the other half of validation (every VALUE, once every declared key is present);
 * it lives on the other side of the import and this file never re-implements it — a value-level
 * refusal (a supplied value the schema rejects) propagates from that call uncaught.
 *
 * USAGE:
 * await stepSeedBroker({
 *   lane, step: StepStub({ step: 'seed', recipe: 'guild-mid-execution' }),
 * });
 * // Returns a ContentText — the JSON rendering of every saveRecordAs row the recipe's plan made
 */

import { runtimeDynamicImportAdapter } from '@dungeonmaster/shared/adapters';
import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';
import { recipesConventionStatics } from '@dungeonmaster/shared/statics';

import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import type { Step } from '../../../contracts/step/step-contract';
import { RecipeParamsRefusedError } from '../../../errors/recipe-params-refused/recipe-params-refused-error';
import { RecipeUnknownError } from '../../../errors/recipe-unknown/recipe-unknown-error';
import { RecipesListingExportInvalidError } from '../../../errors/recipes-listing-export-invalid/recipes-listing-export-invalid-error';
import { recipesLocateBroker } from '../../recipes/locate/recipes-locate-broker';
import { recipesReadBroker } from '../../recipes/read/recipes-read-broker';

export const stepSeedBroker = async ({
  lane,
  step,
}: {
  lane: LaneSession;
  step: Step;
}): Promise<ContentText> => {
  if (step.step !== 'seed') {
    throw new Error(
      `step-seed-broker: expected a 'seed' step, got '${step.step}' — the caller's own dispatch should have already filtered this`,
    );
  }

  const listing = await recipesReadBroker();
  const entry = listing.find((candidate) => candidate.recipeName === step.recipe);
  if (entry === undefined) {
    throw new RecipeUnknownError({
      recipeName: step.recipe,
      known: listing.map((candidate) => candidate.recipeName),
    });
  }

  // A key check only, off the listing's own `inputKeys` — the recipe's own schema (on the other
  // side of the import, below) is what refuses a malformed VALUE.
  const suppliedKeys = step.params === null ? [] : Object.keys(step.params);
  const offendingKey = suppliedKeys.find(
    (key) => !entry.inputKeys.some((accepted) => accepted === key),
  );
  if (offendingKey !== undefined) {
    throw new RecipeParamsRefusedError({
      recipeName: step.recipe,
      key: offendingKey,
      reason: 'unrecognized',
      accepted: entry.inputKeys,
    });
  }

  const missingKey = entry.inputKeys.find(
    (accepted) => !suppliedKeys.some((key) => key === accepted),
  );
  if (missingKey !== undefined) {
    throw new RecipeParamsRefusedError({
      recipeName: step.recipe,
      key: missingKey,
      reason: 'missing',
      accepted: entry.inputKeys,
    });
  }

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
    recipeName: step.recipe,
    params: step.params,
    home: lane.homePath,
    baseUrl: lane.baseUrl,
  });

  return contentTextContract.parse(JSON.stringify(raw));
};
