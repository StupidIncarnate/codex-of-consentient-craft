/**
 * PURPOSE: Drives the `seed` step — "runs a recipe against this instance and returns the ids it
 * made" (siegelense-tooling.md line 2672). The FIRST verb that touches no page: a recipe writes
 * files and calls the lane's own API, and "a recipe touches STATE, never a screen"
 * (siegelense-recipes.md line 471), so this broker takes the `LaneSession` rather than its
 * `BrowserSession` and works identically against a browserless lane.
 *
 * It reads two things off the lane and nothing else: the API origin, built from the lane's own
 * `ports.api` — the api process is what binds `/api/*`, so a recipe calling the app's real writer
 * goes straight there rather than through the web port's proxy — and the throwaway home, which is
 * both `DUNGEONMASTER_HOME` and `HOME` for that process and therefore where a Claude transcript has
 * to land.
 *
 * `as` is what makes the ids reachable: `recordBinding` hands them to the batch's own binding
 * store, and `stepInterpolateTransformer` resolves a later step's `{g.guildSlug}` against it. A
 * step with `as: null` still runs the recipe — the STATE is the point, and a walk that does not
 * need the ids should not have to invent a name to throw away.
 *
 * USAGE:
 * await stepSeedBroker({ lane, recipe, parameters: { guild }, as, recordBinding });
 * // Runs the recipe, records the binding, and returns the rendered ids as this step's reading
 */

import { absoluteFilePathContract, contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';
import { environmentStatics } from '@dungeonmaster/shared/statics';
import type { RecipeName, RecipeResult } from '@dungeonmaster/siegelense-recipes/contracts';

import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import type { SeedBindingName } from '../../../contracts/seed-binding-name/seed-binding-name-contract';
import { seedResultRenderTransformer } from '../../../transformers/seed-result-render/seed-result-render-transformer';
import { recipeSeedRunBroker } from '../../recipe/seed-run/recipe-seed-run-broker';

export const stepSeedBroker = async ({
  lane,
  recipe,
  parameters,
  as,
  recordBinding,
}: {
  lane: LaneSession;
  recipe: RecipeName;
  parameters: Record<string, ContentText>;
  as: SeedBindingName | null;
  recordBinding: (params: { name: SeedBindingName; result: RecipeResult }) => void;
}): Promise<ContentText> => {
  const result = await recipeSeedRunBroker({
    recipe,
    apiBaseUrl: contentTextContract.parse(
      `http://${environmentStatics.hostname}:${String(lane.ports.api)}`,
    ),
    homePath: absoluteFilePathContract.parse(lane.homePath),
    parameters,
  });

  if (as !== null) {
    recordBinding({ name: as, result });
  }

  return seedResultRenderTransformer({ result });
};
