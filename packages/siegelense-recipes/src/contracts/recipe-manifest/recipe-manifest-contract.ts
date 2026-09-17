/**
 * PURPOSE: One recipe's whole DECLARATION — everything `dungeonmaster siegelense recipes` can say
 * about it without running it, plus everything a `seed` step needs to call it. Reach for this over
 * reading a recipe's body: the listing is asked before anything has been seeded, so `produces:`,
 * `fidelity` and `mirrors:` have to be data rather than something learned by executing
 * (siegelense-tooling.md line 1995).
 *
 * `mirrors` is PROSE naming the production writer whose shape a `direct` recipe copied — a pointer
 * a diagnosis follows, never an import. Two refinements make the pairing structural rather than a
 * convention nobody checks: `direct` without one is rejected, because the counterpart it copied is
 * where every diagnosis of a drifted fixture starts; anything but `direct` WITH one is rejected too,
 * because a recipe that calls the real code path has nothing to drift from and a pointer there says
 * something untrue.
 *
 * `parameters` is what keeps the catalogue deep rather than wide — a recipe that silently needs a
 * prior one is the ordering folklore that kills a step catalogue, and a named parameter is the fix
 * (siegelense-recipes.md line 281). `returns` is what a walk addresses the new state by: the spec's
 * own worked batch writes `/{g.guildSlug}/quest/{g.questId}` and `{s.sessions.nested}`, and a recipe
 * that made a thing it cannot name is a thing no step can reach.
 *
 * There is deliberately NO field a DOM handle could live in — no selector, no ref, no rect. A recipe
 * touches state, never a screen, and a recipe that wanted one would have to grow a field here, which
 * is a review rather than a typo.
 *
 * USAGE:
 * recipeManifestContract.parse({
 *   name: 'guild-with-three-quests',
 *   produces: 'one guild holding three quests, one in_progress',
 *   fidelity: 'production',
 *   mirrors: null,
 *   parameters: [],
 *   returns: [{ name: 'guildId', description: 'the seeded guild' }],
 * });
 * // Returns a validated RecipeManifest
 */

import { z } from 'zod';

import { recipeFidelityStatics } from '../../statics/recipe-fidelity/recipe-fidelity-statics';
import { recipeFidelityContract } from '../recipe-fidelity/recipe-fidelity-contract';
import { recipeNameContract } from '../recipe-name/recipe-name-contract';

export const recipeManifestContract = z
  .object({
    name: recipeNameContract,
    produces: z.string().min(1).brand<'RecipeProduces'>(),
    fidelity: recipeFidelityContract,
    mirrors: z.string().min(1).brand<'RecipeMirrors'>().nullable(),
    parameters: z.array(
      z
        .object({
          name: z.string().min(1).brand<'RecipeParameterName'>(),
          description: z.string().min(1).brand<'RecipeParameterDescription'>(),
          required: z.boolean(),
        })
        .strict(),
    ),
    returns: z.array(
      z
        .object({
          name: z.string().min(1).brand<'RecipeReturnName'>(),
          description: z.string().min(1).brand<'RecipeReturnDescription'>(),
        })
        .strict(),
    ),
  })
  .strict()
  .refine(
    (manifest) =>
      manifest.fidelity !== recipeFidelityStatics.markers.mirrorsRequired ||
      manifest.mirrors !== null,
    {
      message: `fidelity '${recipeFidelityStatics.markers.mirrorsRequired}' must declare mirrors — name the production writer whose shape it copied, or every diagnosis opens with a hunt for it`,
      path: ['mirrors'],
    },
  )
  .refine(
    (manifest) =>
      manifest.fidelity === recipeFidelityStatics.markers.mirrorsRequired ||
      manifest.mirrors === null,
    {
      message: `mirrors belongs only to fidelity '${recipeFidelityStatics.markers.mirrorsRequired}' — a recipe built by calling the real code path has no counterpart to drift from`,
      path: ['mirrors'],
    },
  );

export type RecipeManifest = z.infer<typeof recipeManifestContract>;
