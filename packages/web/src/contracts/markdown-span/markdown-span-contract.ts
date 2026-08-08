/**
 * PURPOSE: The inline half of a parsed markdown message — a flat, already-resolved run of marks
 * with no nesting. Flatness is the point: a renderer walking this list never recurses, so the
 * widget that draws a span stays a lookup table rather than a tree walker.
 *
 * USAGE:
 * markdownSpanContract.parse({kind: 'code', text: 'navigationHarness'});
 * // Returns a MarkdownSpan discriminated on `kind`
 */

import { z } from 'zod';

export const markdownSpanContract = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('text'),
    text: z.string().brand<'MarkdownSpanText'>(),
  }),
  z.object({
    kind: z.literal('bold'),
    text: z.string().brand<'MarkdownSpanText'>(),
  }),
  z.object({
    kind: z.literal('italic'),
    text: z.string().brand<'MarkdownSpanText'>(),
  }),
  z.object({
    kind: z.literal('code'),
    text: z.string().brand<'MarkdownSpanText'>(),
  }),
  z.object({
    kind: z.literal('link'),
    text: z.string().brand<'MarkdownSpanText'>(),
    href: z.string().brand<'MarkdownSpanHref'>(),
  }),
]);

export type MarkdownSpan = z.infer<typeof markdownSpanContract>;
