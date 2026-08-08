/**
 * PURPOSE: A whole markdown document awaiting render — what an agent wrote, before any of it has
 * been resolved into blocks. Reach for this at a render boundary; `markdownSourceLineContract` is
 * its counterpart INSIDE the parser, where a value is one line whose block is not yet decided.
 *
 * USAGE:
 * markdownSourceContract.parse('## Gate 5\n\nAll claims verified.');
 * // Returns: MarkdownSource branded string
 */

import { z } from 'zod';

export const markdownSourceContract = z.string().brand<'MarkdownSource'>();

export type MarkdownSource = z.infer<typeof markdownSourceContract>;
