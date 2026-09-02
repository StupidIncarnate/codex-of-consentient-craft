/**
 * PURPOSE: Writing a segment list into the contenteditable editor is the RESTORE path only — a page
 * reload rebuilding a persisted draft, or a draft pulled back from IndexedDB — never the
 * per-keystroke path. A keystroke edits the DOM directly and lets domComposerReadAdapter derive the
 * model back out of it; rebuilding the DOM from React state on every change would fight the
 * browser's own caret handling.
 *
 * USAGE:
 * domComposerWriteAdapter({ editor: editorElement, segments, attachments });
 * // Replaces the editor's children with one node per segment and returns { success: true }
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import type { AttachmentId } from '../../../contracts/attachment-id/attachment-id-contract';
import type { ComposerAttachment } from '../../../contracts/composer-attachment/composer-attachment-contract';
import type { ComposerSegment } from '../../../contracts/composer-segment/composer-segment-contract';
import { chatComposerStatics } from '../../../statics/chat-composer/chat-composer-statics';

export const domComposerWriteAdapter = ({
  editor,
  segments,
  attachments,
}: {
  editor: HTMLElement;
  segments: readonly ComposerSegment[];
  attachments: ReadonlyMap<AttachmentId, ComposerAttachment>;
}): AdapterResult => {
  const nodes: Node[] = [];

  segments.forEach((segment) => {
    if (segment.kind === 'text') {
      nodes.push(document.createTextNode(segment.text));
      return;
    }

    const attachment = attachments.get(segment.attachmentId);
    if (attachment === undefined) {
      // The map is a snapshot of what this browser still holds bytes for. A segment naming an
      // attachment that has fallen out of it (evicted from IndexedDB, a draft restored from
      // another tab) is skipped rather than rendered as a broken image with no bytes behind it.
      return;
    }

    const thumbnail = document.createElement('img');
    thumbnail.setAttribute(chatComposerStatics.thumbnail.attributeName, segment.attachmentId);
    thumbnail.setAttribute('data-testid', chatComposerStatics.thumbnail.testId);
    thumbnail.setAttribute('contenteditable', 'false');
    thumbnail.setAttribute('src', attachment.dataUrl);
    nodes.push(thumbnail);
  });

  editor.replaceChildren(...nodes);

  return { success: true as const };
};
