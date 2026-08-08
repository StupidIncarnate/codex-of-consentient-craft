/**
 * PURPOSE: Resolves one line of markdown into a flat run of marks, in a single left-to-right scan
 * with no nesting and no backtracking. The scan order is the whole design: code claims its content
 * before any other mark looks at it, so an agent backticking a glob full of asterisks gets a
 * literal glob rather than a bold run — the case that bites every naive bold-first implementation.
 *
 * Reach for `parseMarkdownBlocksTransformer` instead when the input is a whole message; this one
 * assumes block structure has already been stripped and treats `#`, `-` and `>` as ordinary text.
 *
 * USAGE:
 * parseMarkdownSpansTransformer({text: 'the `nav` const is **shared**'});
 * // Returns [{kind:'text',text:'the '},{kind:'code',text:'nav'},…,{kind:'bold',text:'shared'}]
 */

import { markdownSpanContract } from '../../contracts/markdown-span/markdown-span-contract';
import type { MarkdownSpan } from '../../contracts/markdown-span/markdown-span-contract';

const INLINE_PATTERN =
  /`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*\s][^*]*)\*|(?<![A-Za-z0-9])_([^_\s][^_]*)_(?![A-Za-z0-9])/gu;

export const parseMarkdownSpansTransformer = ({ text }: { text: string }): MarkdownSpan[] => {
  const spans: MarkdownSpan[] = [];
  let cursor = 0;

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const [
      full,
      code,
      linkText,
      linkHref,
      boldStars,
      boldUnderscores,
      italicStar,
      italicUnderscore,
    ] = match;
    const start = match.index;

    if (start > cursor) {
      spans.push(markdownSpanContract.parse({ kind: 'text', text: text.slice(cursor, start) }));
    }

    const bold = boldStars ?? boldUnderscores;
    const italic = italicStar ?? italicUnderscore;

    if (code !== undefined) {
      spans.push(markdownSpanContract.parse({ kind: 'code', text: code }));
    } else if (linkText !== undefined && linkHref !== undefined) {
      spans.push(markdownSpanContract.parse({ kind: 'link', text: linkText, href: linkHref }));
    } else if (bold !== undefined) {
      spans.push(markdownSpanContract.parse({ kind: 'bold', text: bold }));
    } else if (italic !== undefined) {
      spans.push(markdownSpanContract.parse({ kind: 'italic', text: italic }));
    }

    cursor = start + full.length;
  }

  if (cursor < text.length) {
    spans.push(markdownSpanContract.parse({ kind: 'text', text: text.slice(cursor) }));
  }

  return spans;
};
