/**
 * PURPOSE: Chrome, Firefox and Safari each resolve a single Backspace/Delete against an atomic
 * `contenteditable="false"` `<img>` differently — none of them reliably removes just the adjacent
 * thumbnail — so `beforeinput` routes through here instead of falling back to native editing. The
 * id handed back is what lets the caller drop that attachment's IndexedDB draft record in the same
 * keystroke that removes its thumbnail from the DOM. It declines whenever the selection is not
 * collapsed, because a non-collapsed selection is exactly what Playwright's `.fill()` on
 * CHAT_INPUT produces (select-all, then a single native delete), and every one of the 18 e2e specs
 * that fill CHAT_INPUT depends on this adapter staying out of that path.
 *
 * USAGE:
 * domComposerDeleteThumbnailAdapter({ editor, direction: 'backward' });
 * // Returns the removed thumbnail's AttachmentId, or undefined when the caret wasn't touching
 * // one — in which case the caller lets the browser handle the keystroke natively.
 */

import { attachmentIdContract } from '../../../contracts/attachment-id/attachment-id-contract';
import type { AttachmentId } from '../../../contracts/attachment-id/attachment-id-contract';
import { chatComposerStatics } from '../../../statics/chat-composer/chat-composer-statics';

export const domComposerDeleteThumbnailAdapter = ({
  editor,
  direction,
}: {
  editor: HTMLElement;
  direction: 'backward' | 'forward';
}): AttachmentId | undefined => {
  const { ownerDocument } = editor;
  const selection = ownerDocument.getSelection();

  if (selection === null || selection.rangeCount === 0) {
    return undefined;
  }

  // A non-collapsed selection is what Playwright's `.fill()` on CHAT_INPUT produces: it
  // select-alls the field, then runs a single native delete over that selection. Intercepting
  // here would swallow the delete `.fill()` depends on, breaking every one of the 18 e2e specs
  // that fill CHAT_INPUT — so a non-collapsed selection is always left to the browser.
  if (!selection.isCollapsed) {
    return undefined;
  }

  const { anchorNode, anchorOffset } = selection;

  if (anchorNode === null || !editor.contains(anchorNode)) {
    return undefined;
  }

  let candidateNode: ChildNode | null = null;

  if (anchorNode === editor) {
    const siblingIndex = direction === 'backward' ? anchorOffset - 1 : anchorOffset;

    if (siblingIndex >= 0 && siblingIndex < editor.childNodes.length) {
      candidateNode = editor.childNodes[siblingIndex] ?? null;
    }
  } else if (anchorNode instanceof Text) {
    if (direction === 'backward' && anchorOffset === 0) {
      candidateNode = anchorNode.previousSibling;
    } else if (direction === 'forward' && anchorOffset === anchorNode.length) {
      candidateNode = anchorNode.nextSibling;
    }
  }

  if (!(candidateNode instanceof HTMLImageElement)) {
    return undefined;
  }

  const attributeValue = candidateNode.getAttribute(chatComposerStatics.thumbnail.attributeName);

  if (attributeValue === null) {
    return undefined;
  }

  const attachmentId = attachmentIdContract.parse(attributeValue);

  const beforeCandidate = candidateNode.previousSibling;
  const afterCandidate = candidateNode.nextSibling;

  candidateNode.remove();

  let caretContainer: Node = editor;
  let caretOffset = 0;

  if (beforeCandidate instanceof Text && afterCandidate instanceof Text) {
    caretOffset = beforeCandidate.length;
    beforeCandidate.data += afterCandidate.data;
    afterCandidate.remove();
    caretContainer = beforeCandidate;
  } else if (beforeCandidate instanceof Text) {
    caretContainer = beforeCandidate;
    caretOffset = beforeCandidate.length;
  } else if (afterCandidate instanceof Text) {
    caretContainer = afterCandidate;
    caretOffset = 0;
  } else if (beforeCandidate !== null) {
    caretOffset = Array.from(editor.childNodes).indexOf(beforeCandidate) + 1;
  }

  const range = ownerDocument.createRange();
  range.setStart(caretContainer, caretOffset);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);

  return attachmentId;
};
