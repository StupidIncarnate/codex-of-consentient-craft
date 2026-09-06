/**
 * PURPOSE: The composer's content model is derived from its contenteditable DOM on every change
 * rather than driving it, so this is what a DOM read produces and what serialisation into the
 * outgoing message text consumes. An image run carries only the attachment id — the bytes live in
 * the attachment record that id points at — so a segment list stays cheap to hold in React state
 * and to diff on every keystroke.
 *
 * USAGE:
 * composerSegmentContract.parse({ kind: 'text', text: 'hello' });
 * // Returns a ComposerSegment discriminated on `kind`
 */

import { z } from 'zod';

import { attachmentIdContract } from '../attachment-id/attachment-id-contract';

export const composerSegmentContract = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('text'), text: z.string().brand<'ComposerSegmentText'>() }),
  z.object({ kind: z.literal('image'), attachmentId: attachmentIdContract }),
]);

export type ComposerSegment = z.infer<typeof composerSegmentContract>;
