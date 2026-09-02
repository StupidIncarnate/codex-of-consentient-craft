/**
 * PURPOSE: A fresh id per paste (never a content hash) is what lets two pastes of the byte-identical
 * clipboard item become two independent attachments — hashing the bytes would collide them, and a
 * later message editing or removing one attachment would then reach into an earlier transcript's
 * file too. Reach for this over pastedImageDownscaleBroker directly: this one is the composer's
 * paste-handler entry point and owns identity (minting the id); the downscale broker owns bytes
 * (deciding whether and how to re-encode them) and never mints its own id.
 *
 * USAGE:
 * const attachment = await pastedImageAttachBroker({ dataUrl, mediaType });
 * // Returns: ComposerAttachment carrying a freshly minted attachmentId
 */

import type { PastedImageMediaType } from '@dungeonmaster/shared/contracts';

import { pastedImageDownscaleBroker } from '../downscale/pasted-image-downscale-broker';
import { attachmentIdContract } from '../../../contracts/attachment-id/attachment-id-contract';
import type { ComposerAttachment } from '../../../contracts/composer-attachment/composer-attachment-contract';
import type { ImageDataUrl } from '../../../contracts/image-data-url/image-data-url-contract';

export const pastedImageAttachBroker = async ({
  dataUrl,
  mediaType,
}: {
  dataUrl: ImageDataUrl;
  mediaType: PastedImageMediaType;
}): Promise<ComposerAttachment> => {
  // A fresh id every call, unconditionally — never keyed off the bytes. Two pastes of the identical
  // clipboard item must produce two attachments with different ids and identical bytes, because each
  // attachment gets its own file: naming by content hash sounds like a saving but is a bug, since a
  // later message could then replace or remove the file an older transcript's token points at.
  const attachmentId = attachmentIdContract.parse(crypto.randomUUID());

  return pastedImageDownscaleBroker({ attachmentId, dataUrl, mediaType });
};
