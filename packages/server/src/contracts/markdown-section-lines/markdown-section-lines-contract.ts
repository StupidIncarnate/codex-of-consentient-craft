/**
 * PURPOSE: Defines a branded type for an array of markdown section lines
 *
 * USAGE:
 * const lines: MarkdownSectionLines = markdownSectionLinesContract.parse(['# Title', '', 'Content']);
 * // Returns branded readonly array of strings representing markdown section lines
 */
import { z } from 'zod';

export const markdownSectionLinesContract = z
  .array(z.string())
  .readonly()
  .brand<'MarkdownSectionLines'>();

export type MarkdownSectionLines = z.infer<typeof markdownSectionLinesContract>;
