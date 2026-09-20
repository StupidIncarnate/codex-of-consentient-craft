/**
 * PURPOSE: A parameter/input key name accepted by a hydration recipe — such as `guildId` or
 * `guildPath`. Reach for this over a bare string when typing recipe input parameter keys.
 *
 * USAGE:
 * recipeInputKeyContract.parse('guildId');
 * // Returns a branded RecipeInputKey
 */

import { z } from 'zod';

export const recipeInputKeyContract = z.string().min(1).brand<'RecipeInputKey'>();

export type RecipeInputKey = z.infer<typeof recipeInputKeyContract>;
