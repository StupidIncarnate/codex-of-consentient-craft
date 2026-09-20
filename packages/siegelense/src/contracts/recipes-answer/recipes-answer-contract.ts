/**
 * PURPOSE: The whole `recipes {}` answer — one row per recipe the compiled recipes package exports,
 * already proven safe by `recipesListingContract`. A separate wrapper from that array, matching every
 * other call's own `*-answer-contract` shape, so `recipesAnswerRenderTransformer` and the responder's
 * JSON default both read one named field rather than a bare array whose meaning is only implicit. An
 * empty `recipes` array is the third of the plan's three states — "no recipes declared yet", not an
 * installation problem — and is a valid value here, not a refusal.
 *
 * USAGE:
 * recipesAnswerContract.parse({ recipes: [] });
 * // Returns a validated RecipesAnswer
 */

import { z } from 'zod';

import { recipesListingContract } from '../recipes-listing/recipes-listing-contract';

export const recipesAnswerContract = z
  .object({
    recipes: recipesListingContract,
  })
  .strict();

export type RecipesAnswer = z.infer<typeof recipesAnswerContract>;
