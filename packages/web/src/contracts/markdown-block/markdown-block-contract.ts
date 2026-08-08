/**
 * PURPOSE: The block half of a parsed markdown message. Lists arrive pre-flattened — one block per
 * item, carrying its own `depth` — rather than as nested containers, so a renderer emits items in
 * source order and expresses nesting as left padding. That is what keeps the renderer a `.map()`
 * and lets the tail of a long agent message stream in without restructuring what came before.
 *
 * USAGE:
 * markdownBlockContract.parse({kind: 'heading', level: 2, spans: [{kind: 'text', text: 'Gate 5'}]});
 * // Returns a MarkdownBlock discriminated on `kind`
 */

import { z } from 'zod';

import { markdownSyntaxStatics } from '../../statics/markdown-syntax/markdown-syntax-statics';
import { markdownSpanContract } from '../markdown-span/markdown-span-contract';

const spansContract = z.array(markdownSpanContract);

export const markdownBlockContract = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('heading'),
    level: z
      .number()
      .int()
      .min(markdownSyntaxStatics.minHeadingLevel)
      .max(markdownSyntaxStatics.maxHeadingLevel)
      .brand<'MarkdownHeadingLevel'>(),
    spans: spansContract,
  }),
  z.object({
    kind: z.literal('paragraph'),
    spans: spansContract,
  }),
  z.object({
    kind: z.literal('list-item'),
    marker: z.string().min(1).brand<'MarkdownListMarker'>(),
    depth: z
      .number()
      .int()
      .min(0)
      .max(markdownSyntaxStatics.maxListDepth)
      .brand<'MarkdownListDepth'>(),
    spans: spansContract,
  }),
  z.object({
    kind: z.literal('quote'),
    spans: spansContract,
  }),
  z.object({
    kind: z.literal('code-block'),
    language: z.string().brand<'MarkdownCodeLanguage'>(),
    content: z.string().brand<'MarkdownCodeContent'>(),
  }),
  z.object({
    kind: z.literal('rule'),
  }),
]);

export type MarkdownBlock = z.infer<typeof markdownBlockContract>;
