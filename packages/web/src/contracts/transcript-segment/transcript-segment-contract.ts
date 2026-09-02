/**
 * PURPOSE: A transcript bubble renders a message the server already has a durable copy of, unlike
 * the composer's live draft, so its image segments carry a renderable `src` directly rather than an
 * attachmentId pointing at browser-only state (composerSegmentContract's shape). Reach for this one
 * wherever a message is being read back for display, and for composerSegmentContract wherever a
 * message is still being typed.
 *
 * USAGE:
 * transcriptSegmentContract.parse({ kind: 'text', text: 'hello' });
 * // Returns a TranscriptSegment discriminated on `kind`
 */

import { z } from 'zod';

export const transcriptSegmentContract = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('text'), text: z.string().brand<'TranscriptSegmentText'>() }),
  z.object({
    kind: z.literal('image'),
    ordinal: z.number().int().positive().brand<'TranscriptSegmentOrdinal'>(),
    src: z.string().min(1).brand<'TranscriptSegmentSrc'>(),
  }),
]);

export type TranscriptSegment = z.infer<typeof transcriptSegmentContract>;
