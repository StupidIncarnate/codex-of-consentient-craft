/**
 * PURPOSE: Brands the output of pasteMediaTypeNormalizeTransformer, so a value that has only been
 * lowercased and trimmed can never be mistaken at compile time for one pastedImageMediaTypeContract
 * has actually validated against the allow-list. Reach for this on a clipboard-declared type BEFORE
 * it reaches isAllowedPasteMediaTypeGuard; reach for pastedImageMediaTypeContract only once that
 * guard has passed.
 *
 * USAGE:
 * normalizedPasteMediaTypeContract.parse('image/png');
 * // Returns branded NormalizedPasteMediaType
 */

import { z } from 'zod';

export const normalizedPasteMediaTypeContract = z.string().brand<'NormalizedPasteMediaType'>();

export type NormalizedPasteMediaType = z.infer<typeof normalizedPasteMediaTypeContract>;
