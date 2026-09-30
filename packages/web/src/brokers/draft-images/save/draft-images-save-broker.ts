/**
 * PURPOSE: The bytes for a pasted image never go into the localStorage text draft — one 5 MB image
 * is roughly 6.8 MB once base64-encoded, which alone exceeds the whole origin's localStorage quota,
 * so storing even a single paste there would fail and take the text draft down with it. This broker
 * is the one place that writes the IndexedDB half of a draft; call it any time the composer's
 * attachment list changes (paste or delete), never only on send. `scopeKey` stamps every record
 * with which composer it belongs to and scopes the replace to that composer alone — see
 * composerScopeKeyTransformer and isComposerScopeMatchGuard.
 *
 * USAGE:
 * await draftImagesSaveBroker({ scopeKey: 'quest-a', attachments });
 * // Returns nothing — IndexedDB now holds exactly these attachments under THIS scope, in
 * // this order; every other composer's records are untouched
 */

import { openStore, replaceAll } from '#gateway/browser/indexedDB';

import type { ComposerAttachment } from '../../../contracts/composer-attachment/composer-attachment-contract';
import { pastedImageDraftContract } from '../../../contracts/pasted-image-draft/pasted-image-draft-contract';
import { isComposerScopeMatchGuard } from '../../../guards/is-composer-scope-match/is-composer-scope-match-guard';
import { chatComposerStatics } from '../../../statics/chat-composer/chat-composer-statics';
import { dataUrlSplitTransformer } from '../../../transformers/data-url-split/data-url-split-transformer';

export const draftImagesSaveBroker = async ({
  scopeKey,
  attachments,
}: {
  scopeKey: string;
  attachments: readonly ComposerAttachment[];
}): Promise<void> => {
  // The text draft's [Pasted Image N] placeholders are the only source of truth for ORDER, and a
  // paste can land BETWEEN two existing images — so insertion order and placeholder order diverge
  // the moment anything but a plain append happens. The caller passes attachments in composer
  // (left-to-right) order, and this broker hands the whole list to a REPLACE rather than a
  // targeted add/delete, so a later read back out of IndexedDB always lines up with the
  // placeholders again, however the list was edited.
  const drafts = attachments.map((attachment) => {
    const { mediaType, dataBase64 } = dataUrlSplitTransformer({ dataUrl: attachment.dataUrl });

    return pastedImageDraftContract.parse({
      attachmentId: attachment.attachmentId,
      mediaType,
      dataBase64,
      scopeKey,
    });
  });

  const { name, version, storeName } = chatComposerStatics.draftDatabase;

  try {
    const db = await openStore({ name, version, storeName });

    try {
      // Read-then-clear-then-add in ONE transaction, every time — never a targeted patch. Every
      // OTHER scope's records are read back and re-added alongside this scope's fresh set: a bare
      // clear() would wipe every composer's drafts at once, not just this one's (see
      // isComposerScopeMatchGuard's header). This only runs on a paste or a delete, never on a
      // keystroke.
      await replaceAll({
        db,
        storeName,
        replace: ({ existing }) => [
          ...existing.filter((record) => !isComposerScopeMatchGuard({ record, scopeKey })),
          ...drafts,
        ],
      });
    } finally {
      db.close();
    }
  } catch (error) {
    throw new Error(
      `draftImagesSaveBroker: failed to save draft images — ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
};
