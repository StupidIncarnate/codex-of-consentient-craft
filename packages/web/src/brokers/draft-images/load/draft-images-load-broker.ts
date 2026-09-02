/**
 * PURPOSE: The IndexedDB half of restoring the composer after a page reload — the localStorage text
 * draft carries `[Pasted Image N]` placeholders, and this broker is what turns the stored bytes back
 * into the render-ready ComposerAttachment array those placeholders index into. Reach for this over
 * calling indexedDbDraftImagesReadAdapter directly whenever the caller needs thumbnails to paint,
 * not raw persisted rows; reach for draftImagesSaveBroker instead when the composer's attachment
 * list just changed and IndexedDB needs to catch up, not the other way around.
 *
 * USAGE:
 * const attachments = await draftImagesLoadBroker();
 * // Returns: readonly ComposerAttachment[] — every still-valid stored draft, in store order
 */

import { canvasImageMeasureAdapter } from '../../../adapters/canvas/image-measure/canvas-image-measure-adapter';
import { indexedDbDraftImagesReadAdapter } from '../../../adapters/indexed-db/draft-images-read/indexed-db-draft-images-read-adapter';
import { composerAttachmentContract } from '../../../contracts/composer-attachment/composer-attachment-contract';
import type { ComposerAttachment } from '../../../contracts/composer-attachment/composer-attachment-contract';
import type { PastedImageDraft } from '../../../contracts/pasted-image-draft/pasted-image-draft-contract';
import { base64ByteLengthTransformer } from '../../../transformers/base64-byte-length/base64-byte-length-transformer';
import { dataUrlBuildTransformer } from '../../../transformers/data-url-build/data-url-build-transformer';

export const draftImagesLoadBroker = async (): Promise<readonly ComposerAttachment[]> => {
  const drafts: readonly PastedImageDraft[] = await indexedDbDraftImagesReadAdapter().catch(
    (error: unknown) => {
      throw new Error(
        `draftImagesLoadBroker: failed to read draft images — ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    },
  );

  // Measured concurrently rather than one `await` per iteration of a loop — this repo's
  // `no-await-in-loop` lint rule bans the latter, and Promise.allSettled keeps each draft's
  // outcome lined up with its own index in `drafts`, which is what lets the loop below tell a
  // rejected measurement apart from its neighbours without re-deriving order from anything else.
  const outcomes = await Promise.allSettled(
    drafts.map(async (draft): Promise<ComposerAttachment> => {
      const dataUrl = dataUrlBuildTransformer({
        mediaType: draft.mediaType,
        dataBase64: draft.dataBase64,
      });
      const byteLength = base64ByteLengthTransformer({ dataBase64: draft.dataBase64 });

      // pastedImageDraftContract carries only {attachmentId, mediaType, dataBase64} — fixed by
      // the quest spec — so widthPx/heightPx are not something the store has to hand back. They
      // are re-measured here, from the data URL just rebuilt above, on every restore. Do not
      // "optimise" this by adding a widthPx/heightPx field to the draft contract.
      const { widthPx, heightPx } = await canvasImageMeasureAdapter({ dataUrl });

      return composerAttachmentContract.parse({
        attachmentId: draft.attachmentId,
        mediaType: draft.mediaType,
        dataUrl,
        byteLength,
        widthPx,
        heightPx,
      });
    }),
  );

  const attachments: ComposerAttachment[] = [];
  for (const outcome of outcomes) {
    if (outcome.status === 'fulfilled') {
      attachments.push(outcome.value);
      continue;
    }

    // A draft whose bytes fail to decode into an image is a corrupt record a previous session
    // left on the user's disk — skipped, not thrown, so one bad row cannot make the whole
    // composer refuse to restore its other thumbnails.
    globalThis.console.error(
      '[draft-images-load] failed to measure a stored draft',
      outcome.reason,
    );
  }

  return attachments;
};
