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

import { z } from '#gateway/npm/zod';

import { composerAttachmentContract } from '../composer-attachment/composer-attachment-contract';

export const composerSegmentContract = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('text'), text: z.string().brand<'ComposerSegmentText'>() }).brand<'ComposerSegment'>(),
  z.object({ kind: z.literal('image'), attachmentId: composerAttachmentContract.shape.attachmentId }).brand<'ComposerSegment'>(),
]);

export type ComposerSegment = z.infer<typeof composerSegmentContract>;

// The pre-parse shape: what a DOM read holds before it merges adjacent text runs and parses each
// one through the contract.
export type ComposerSegmentInput = z.input<typeof composerSegmentContract>;
