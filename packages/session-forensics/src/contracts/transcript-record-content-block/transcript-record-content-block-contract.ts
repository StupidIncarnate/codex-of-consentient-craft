/**
 * PURPOSE: One entry of a transcript record's `message.content` array. It can be a text run, a
 * thinking run, a tool call, or a tool result. Reach for this whenever code reads or constructs a
 * content block, instead of redeclaring the shape inline. That way a transformer that normalises
 * or re-brands a block — folding a bare string into a text block, for instance — has a real
 * contract to `.parse()` through rather than an `as` cast.
 *
 * USAGE:
 * transcriptRecordContentBlockContract.parse({ type: 'text', text: 'Reading the file now.' });
 * // Returns the branded TranscriptRecordContentBlock.
 * // Every field but `type` is optional.
 */
import { z } from '#gateway/npm/zod';

export const transcriptRecordContentBlockContract = z
  .object({
    type: z.string().brand<'TranscriptRecordContentBlockType'>(),
    text: z.string().brand<'TranscriptRecordContentBlockText'>().optional(),
    thinking: z.string().brand<'TranscriptRecordContentBlockThinking'>().optional(),
    name: z.string().brand<'TranscriptRecordContentBlockName'>().optional(),
    input: z.record(z.string(), z.json()).optional(),
  })
  .brand<'TranscriptRecordContentBlock'>();

export type TranscriptRecordContentBlock = z.infer<typeof transcriptRecordContentBlockContract>;
