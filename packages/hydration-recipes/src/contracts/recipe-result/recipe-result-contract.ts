/**
 * PURPOSE: The ids a recipe actually made, keyed by the names its own manifest declared under
 * `returns` — "a walk cannot address what it cannot name" (siegelense-recipes.md line 427). Reach
 * for this over inventing a per-recipe return type: one shape is what lets `recipeSeedRunBroker`
 * compare the keys a recipe produced against the keys its manifest promised, which is the whole
 * mechanism behind "the listing and the runner read one declaration" (line 713).
 *
 * FLAT, with dotted keys — `sessions.nested` is a KEY here, not a nested object — because that is
 * the form the book already declares its return names in. A nested value would have to be walked to
 * be checked against a flat list of declared names, and the dots would then live in two shapes at
 * once. `seedResultRenderTransformer` expands them back for display, so what a reader sees is still
 * the nested object siegelense-tooling.md line 2676 prints.
 *
 * USAGE:
 * recipeResultContract.parse({ guildSlug: 'siege-guild', 'sessions.nested': '/siege-guild/session/s1' });
 * // Returns a validated RecipeResult
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

import { recipeReturnNameContract } from '../recipe-return-name/recipe-return-name-contract';

export const recipeResultContract = z.record(recipeReturnNameContract, contentTextContract);

export type RecipeResult = z.infer<typeof recipeResultContract>;
