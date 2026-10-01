/**
 * PURPOSE: The composer is a contenteditable div, and its content model must be DERIVED from the
 * DOM rather than driving it — if React owned the editor's children and re-rendered them from
 * state on every keystroke, the browser would reset the caret to the start of the element on every
 * character typed. This transformer is the one place that walks the live DOM and turns it back into
 * the ComposerSegment[] the rest of the app reasons about.
 *
 * USAGE:
 * composerReadTransformer({ editor: editorElement });
 * // Returns readonly ComposerSegment[] built from the editor's current children
 */

import { Element } from '#gateway/browser/Element';
import { Text } from '#gateway/browser/Text';

import type {
  ComposerSegment,
  ComposerSegmentInput,
} from '../../contracts/composer-segment/composer-segment-contract';
import { composerSegmentContract } from '../../contracts/composer-segment/composer-segment-contract';
import { chatComposerStatics } from '../../statics/chat-composer/chat-composer-statics';

export const composerReadTransformer = ({
  editor,
}: {
  editor: HTMLElement;
}): readonly ComposerSegment[] => {
  const rawSegments: ComposerSegmentInput[] = [];

  editor.childNodes.forEach((node) => {
    if (node instanceof Text) {
      rawSegments.push({ kind: 'text', text: node.data });
      return;
    }

    if (!(node instanceof Element)) {
      return;
    }

    if (node.tagName === 'IMG' && node.hasAttribute(chatComposerStatics.thumbnail.attributeName)) {
      const attachmentId = node.getAttribute(chatComposerStatics.thumbnail.attributeName);
      if (attachmentId !== null) {
        rawSegments.push({ kind: 'image', attachmentId });
      }
      return;
    }

    if (node.tagName === 'BR') {
      // composerInsertTextBroker's caret filler — a real DOM element the browser needs to
      // render a caret after a trailing newline, but never actual composer content. Contributes
      // nothing here, the same way it contributes nothing to a raw `.textContent` read.
      if (node.hasAttribute(chatComposerStatics.caretFiller.attributeName)) {
        return;
      }
      rawSegments.push({ kind: 'text', text: '\n' });
      return;
    }

    rawSegments.push({ kind: 'text', text: node.textContent });
  });

  // Adjacent text segments merge into ONE before the empty-segment drop below. A browser leaves
  // two sibling text nodes behind after an insert (typing right next to a freshly inserted
  // thumbnail, for instance), and without this merge the same visible content would read as a
  // different segment list depending on how the caret got there — which breaks the round trip
  // against composerParseDraftTransformer. Merging belongs here, in the segment list, rather than
  // as an `editor.normalize()` DOM mutation: normalize moves the caret, and a reader did not ask
  // for that.
  const mergedSegments: ComposerSegmentInput[] = [];
  rawSegments.forEach((segment) => {
    const lastIndex = mergedSegments.length - 1;
    const last = mergedSegments[lastIndex];
    if (segment.kind === 'text' && last?.kind === 'text') {
      mergedSegments[lastIndex] = { kind: 'text', text: last.text + segment.text };
      return;
    }
    mergedSegments.push(segment);
  });

  return mergedSegments
    .filter((segment) => segment.kind !== 'text' || segment.text.length > 0)
    .map((segment) => composerSegmentContract.parse(segment));
};
