/**
 * PURPOSE: Marks text whose file paths have been elided for display, so a caller cannot hand it
 * back to anything that resolves or compares paths. Reach for this on the collapsed half of a
 * disclosure; the expanded half keeps the untouched path, which is the one a reader copies.
 *
 * USAGE:
 * shortenedPathTextContract.parse('web/…/tool-row-widget.tsx');
 * // Returns: ShortenedPathText branded string
 */

import { z } from 'zod';

export const shortenedPathTextContract = z.string().brand<'ShortenedPathText'>();

export type ShortenedPathText = z.infer<typeof shortenedPathTextContract>;
