/**
 * PURPOSE: Inserts a pasted-image thumbnail at the composer's live caret through an explicit
 * Range, for the same reason domComposerInsertTextAdapter bypasses native insertion: caret
 * behaviour around an atomic `contenteditable="false"` image is inconsistent across browsers, and
 * driving the Range ourselves keeps it identical everywhere. Reach for this over
 * domComposerInsertTextAdapter whenever the paste carries image bytes rather than plain text.
 *
 * USAGE:
 * domComposerInsertImageAdapter({ editor, attachment });
 * // Inserts an <img> thumbnail for `attachment` at the live caret (or at the end of the editor
 * // when the caret has drifted outside it), leaves no empty text nodes behind, and collapses the
 * // caret after the thumbnail.
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import type { ComposerAttachment } from '../../../contracts/composer-attachment/composer-attachment-contract';
import { chatComposerStatics } from '../../../statics/chat-composer/chat-composer-statics';

export const domComposerInsertImageAdapter = ({
  editor,
  attachment,
}: {
  editor: HTMLElement;
  attachment: ComposerAttachment;
}): AdapterResult => {
  const { ownerDocument } = editor;
  const selection = ownerDocument.getSelection();
  const liveRange = selection !== null && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  const range: Range =
    liveRange !== null && editor.contains(liveRange.commonAncestorContainer)
      ? liveRange
      : ownerDocument.createRange();

  if (liveRange === null || !editor.contains(liveRange.commonAncestorContainer)) {
    range.selectNodeContents(editor);
    range.collapse(false);
  }

  range.deleteContents();

  const thumbnail = ownerDocument.createElement('img');
  thumbnail.setAttribute('contenteditable', 'false');
  thumbnail.setAttribute(chatComposerStatics.thumbnail.attributeName, attachment.attachmentId);
  thumbnail.setAttribute('data-testid', chatComposerStatics.thumbnail.testId);
  thumbnail.setAttribute('src', attachment.dataUrl);
  thumbnail.setAttribute('alt', 'Pasted image');

  range.insertNode(thumbnail);

  const { previousSibling, nextSibling } = thumbnail;
  if (
    previousSibling !== null &&
    previousSibling.nodeType === Node.TEXT_NODE &&
    previousSibling.textContent === ''
  ) {
    previousSibling.remove();
  }
  if (
    nextSibling !== null &&
    nextSibling.nodeType === Node.TEXT_NODE &&
    nextSibling.textContent === ''
  ) {
    nextSibling.remove();
  }

  const collapsedRange = ownerDocument.createRange();
  collapsedRange.setStartAfter(thumbnail);
  collapsedRange.collapse(true);
  selection?.removeAllRanges();
  selection?.addRange(collapsedRange);

  return { success: true as const };
};
