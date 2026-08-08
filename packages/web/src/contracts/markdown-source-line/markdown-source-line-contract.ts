/**
 * PURPOSE: A line of markdown still in its source form, held while the block parser decides what it
 * belongs to — the paragraph being accumulated, the fence being collected, or the fence's language
 * tag. Reach for this only inside parsing; once a line has been resolved it is spans or a block,
 * and carrying the source form past that point is what lets raw syntax leak into a rendered view.
 *
 * USAGE:
 * markdownSourceLineContract.parse('Gate 4 complete.');
 * // Returns: MarkdownSourceLine branded string
 */

import { z } from 'zod';

export const markdownSourceLineContract = z.string().brand<'MarkdownSourceLine'>();

export type MarkdownSourceLine = z.infer<typeof markdownSourceLineContract>;
