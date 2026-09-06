/**
 * PURPOSE: Inserts text at the composer's live caret through an explicit Range rather than a
 * native `beforeinput`/paste write, because caret placement next to an atomic
 * `contenteditable="false"` thumbnail is not consistent across browsers — driving the Range
 * ourselves keeps the boundary behaviour identical everywhere. Reach for this over
 * domComposerInsertImageAdapter for any plain-text insertion: a keystroke, a text-only paste, or
 * the text half of a mixed paste.
 *
 * USAGE:
 * domComposerInsertTextAdapter({ editor, text: 'hello' });
 * // Inserts 'hello' at the live caret (or at the end of the editor when the caret has drifted
 * // outside it), leaves no empty text nodes behind, and collapses the caret after the text.
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { composerCaretFillerElementTransformer } from '../../../transformers/composer-caret-filler-element/composer-caret-filler-element-transformer';

export const domComposerInsertTextAdapter = ({
  editor,
  text,
}: {
  editor: HTMLElement;
  text: string;
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

  const textNode = ownerDocument.createTextNode(text);
  range.insertNode(textNode);

  const { previousSibling, nextSibling } = textNode;
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

  // A trailing newline with nothing after it has no rendered line for a browser to rest a caret on
  // — the position the caret is set to below gets silently collapsed back to BEFORE the newline,
  // and the next keystroke lands there instead of after it. Reserving an empty, marked <br> right
  // after the newline gives the browser a real (if invisible) line to place the caret on. Only
  // fires when this insertion landed at the true end of the editor — textNode.nextSibling is
  // re-read here, AFTER the empty-sibling cleanup above, so an existing filler from a previous
  // Shift+Enter (which would already sit right after textNode) is recognised and never duplicated.
  if (text.endsWith('\n') && textNode.nextSibling === null) {
    textNode.after(composerCaretFillerElementTransformer({ ownerDocument }));
  }

  const collapsedRange = ownerDocument.createRange();
  collapsedRange.setStartAfter(textNode);
  collapsedRange.collapse(true);
  selection?.removeAllRanges();
  selection?.addRange(collapsedRange);

  return { success: true as const };
};
