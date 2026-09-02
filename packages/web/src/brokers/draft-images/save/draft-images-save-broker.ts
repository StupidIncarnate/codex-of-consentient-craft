/**
 * PURPOSE: The bytes for a pasted image never go into the localStorage text draft — one 5 MB image
 * is roughly 6.8 MB once base64-encoded, which alone exceeds the whole origin's localStorage quota,
 * so storing even a single paste there would fail and take the text draft down with it. This broker
 * is the one place that writes the IndexedDB half of a draft; call it any time the composer's
 * attachment list changes (paste or delete), never only on send.
 *
 * USAGE:
 * await draftImagesSaveBroker({ attachments });
 * // Returns AdapterResult — IndexedDB now holds exactly these attachments, in this order
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { indexedDbDraftImagesReplaceAdapter } from '../../../adapters/indexed-db/draft-images-replace/indexed-db-draft-images-replace-adapter';
import type { ComposerAttachment } from '../../../contracts/composer-attachment/composer-attachment-contract';
import { pastedImageDraftContract } from '../../../contracts/pasted-image-draft/pasted-image-draft-contract';
import { dataUrlSplitTransformer } from '../../../transformers/data-url-split/data-url-split-transformer';

export const draftImagesSaveBroker = async ({
  attachments,
}: {
  attachments: readonly ComposerAttachment[];
}): Promise<AdapterResult> => {
  // The text draft's [Pasted Image N] placeholders are the only source of truth for ORDER, and a
  // paste can land BETWEEN two existing images — so insertion order and placeholder order diverge
  // the moment anything but a plain append happens. The caller passes attachments in composer
  // (left-to-right) order, and this broker hands the whole list to a REPLACE adapter rather than a
  // targeted add/delete, so a later read back out of IndexedDB always lines up with the
  // placeholders again, however the list was edited.
  const drafts = attachments.map((attachment) => {
    const { mediaType, dataBase64 } = dataUrlSplitTransformer({ dataUrl: attachment.dataUrl });

    return pastedImageDraftContract.parse({
      attachmentId: attachment.attachmentId,
      mediaType,
      dataBase64,
    });
  });

  try {
    return await indexedDbDraftImagesReplaceAdapter({ drafts });
  } catch (error) {
    throw new Error(
      `draftImagesSaveBroker: failed to save draft images — ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
};
