/**
 * PURPOSE: Branded quest title string, split out from questContract so transformers that slug a
 * display name (nameToUrlSlugTransformer) can accept it without importing the whole Quest shape.
 *
 * USAGE:
 * questTitleContract.parse('Add Authentication');
 * // Returns QuestTitle branded string
 */

import { z } from 'zod';

export const questTitleContract = z.string().min(1).brand<'QuestTitle'>();
export type QuestTitle = z.infer<typeof questTitleContract>;
