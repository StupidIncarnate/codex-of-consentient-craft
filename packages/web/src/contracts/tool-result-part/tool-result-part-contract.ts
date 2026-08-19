/**
 * PURPOSE: One display unit of a tool result, after the raw reply has been resolved into what the
 * reader should actually see. A result is not uniformly one thing — a JSON answer whose `prompt`
 * property holds a whole markdown document has to render that property formatted and the scalars
 * beside it verbatim, in one list, in source order — so the unit carries its own verdict rather
 * than the result carrying one for all of it. `label` is absent exactly when the part IS the whole
 * reply rather than one property of it, which is how a renderer knows whether to caption it.
 *
 * USAGE:
 * toolResultPartContract.parse({kind: 'markdown', label: 'prompt', source: '# Operator\n\nYou own…'});
 * // Returns a ToolResultPart discriminated on `kind`
 */

import { z } from 'zod';

import { markdownSourceContract } from '../markdown-source/markdown-source-contract';
import { toolResultKeyContract } from '../tool-result-key/tool-result-key-contract';

export const toolResultPartContract = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('markdown'),
    label: toolResultKeyContract.optional(),
    source: markdownSourceContract,
  }),
  z.object({
    kind: z.literal('text'),
    label: toolResultKeyContract.optional(),
    text: z.string().brand<'ToolResultPartText'>(),
  }),
]);

export type ToolResultPart = z.infer<typeof toolResultPartContract>;
