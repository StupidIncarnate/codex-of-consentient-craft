/**
 * PURPOSE: The bytes for one pasted image live in IndexedDB rather than beside the text in
 * localStorage — a single 5 MB image is roughly 6.8 MB once base64-encoded, which alone exceeds
 * the whole origin's localStorage quota, so storing even one paste there would fail and take the
 * text draft down with it. Reach for this over composerAttachmentContract when persisting a
 * draft across a reload; this one is the persisted form and carries no render fields.
 *
 * USAGE:
 * pastedImageDraftContract.parse({ attachmentId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', mediaType: 'image/png', dataBase64: 'iVBORw0KGgo=' });
 * // Returns: PastedImageDraft — one image record read back from IndexedDB on reload
 */

import { z } from 'zod';

import {
  pastedImageMediaTypeContract,
  pastedImageUploadContract,
} from '@dungeonmaster/shared/contracts';

import { attachmentIdContract } from '../attachment-id/attachment-id-contract';

export const pastedImageDraftContract = z.object({
  // Matches the attachment named by a [Pasted Image N] placeholder in the localStorage text
  // draft, so a reload rebuilds each thumbnail in the position its placeholder marks.
  attachmentId: attachmentIdContract,
  // What rebuilds the data URL on restore.
  mediaType: pastedImageMediaTypeContract,
  dataBase64: pastedImageUploadContract.shape.dataBase64,
});

export type PastedImageDraft = z.infer<typeof pastedImageDraftContract>;
