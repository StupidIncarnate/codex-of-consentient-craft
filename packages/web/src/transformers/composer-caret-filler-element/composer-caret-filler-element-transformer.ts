/**
 * PURPOSE: domComposerInsertTextAdapter (the live per-keystroke path) and domComposerWriteAdapter
 * (the RESTORE path, rebuilding a persisted draft after a reload) both have to hand the browser a
 * renderable position after a trailing newline that would otherwise have nothing following it — see
 * chatComposerStatics.caretFiller for the underlying contenteditable quirk. Reach for this rather
 * than hand-rolling the marked <br> a second time, so the marker attribute and its value can never
 * drift between the two call sites.
 *
 * USAGE:
 * composerCaretFillerElementTransformer({ ownerDocument: document });
 * // Returns a new, empty <br> carrying chatComposerStatics.caretFiller.attributeName="true"
 */

import { chatComposerStatics } from '../../statics/chat-composer/chat-composer-statics';

export const composerCaretFillerElementTransformer = ({
  ownerDocument,
}: {
  ownerDocument: Document;
}): HTMLBRElement => {
  const caretFiller = ownerDocument.createElement('br');
  caretFiller.setAttribute(chatComposerStatics.caretFiller.attributeName, 'true');
  return caretFiller;
};
