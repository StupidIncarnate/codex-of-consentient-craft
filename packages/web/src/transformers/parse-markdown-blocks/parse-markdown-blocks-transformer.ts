/**
 * PURPOSE: Turns a whole agent message into the block list a renderer walks. Consecutive prose
 * lines are rejoined into one paragraph, which is why this cannot be done per line: a model that
 * hard-wraps its prose must not render with a break at every wrap point, and only something
 * holding a buffer across lines can tell a wrap from a deliberate blank line.
 *
 * Everything inside a fence is passed through verbatim — a fence containing `# heading` or `- item`
 * is code, not structure — so this is also the only place that decides where a fence ends.
 *
 * USAGE:
 * parseMarkdownBlocksTransformer({text: '## Gate 5\n\nAll claims verified.'});
 * // Returns [{kind:'heading',level:2,spans:[…]},{kind:'paragraph',spans:[…]}]
 */

import { markdownBlockContract } from '../../contracts/markdown-block/markdown-block-contract';
import type { MarkdownBlock } from '../../contracts/markdown-block/markdown-block-contract';
import { markdownSourceLineContract } from '../../contracts/markdown-source-line/markdown-source-line-contract';
import type { MarkdownSourceLine } from '../../contracts/markdown-source-line/markdown-source-line-contract';
import { markdownSyntaxStatics } from '../../statics/markdown-syntax/markdown-syntax-statics';
import { parseMarkdownSpansTransformer } from '../parse-markdown-spans/parse-markdown-spans-transformer';

const HEADING = /^ {0,3}(#{1,6})\s+(.*)$/u;
const LIST_ITEM = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/u;
const QUOTE = /^ {0,3}>\s?(.*)$/u;
const RULE = /^(?:-{3,}|\*{3,}|_{3,})$/u;
const BULLET_MARKER = /^[-*+]$/u;

export const parseMarkdownBlocksTransformer = ({ text }: { text: string }): MarkdownBlock[] => {
  const blocks: MarkdownBlock[] = [];
  const paragraph: MarkdownSourceLine[] = [];
  const fenced: MarkdownSourceLine[] = [];
  let fenceLanguage: MarkdownSourceLine | null = null;

  for (const line of text.split('\n')) {
    const trimmed = line.trim();

    if (fenceLanguage !== null) {
      if (trimmed.startsWith(markdownSyntaxStatics.codeFence)) {
        blocks.push(
          markdownBlockContract.parse({
            kind: 'code-block',
            language: fenceLanguage,
            content: fenced.join('\n'),
          }),
        );
        fenced.length = 0;
        fenceLanguage = null;
        continue;
      }

      fenced.push(markdownSourceLineContract.parse(line));
      continue;
    }

    const isFenceStart = trimmed.startsWith(markdownSyntaxStatics.codeFence);
    const isRule = RULE.test(trimmed);
    const heading = HEADING.exec(line);
    const listItem = LIST_ITEM.exec(line);
    const quote = QUOTE.exec(line);
    const endsParagraph =
      trimmed === '' ||
      isFenceStart ||
      isRule ||
      heading !== null ||
      listItem !== null ||
      quote !== null;

    if (endsParagraph && paragraph.length > 0) {
      blocks.push(
        markdownBlockContract.parse({
          kind: 'paragraph',
          spans: parseMarkdownSpansTransformer({ text: paragraph.join(' ') }),
        }),
      );
      paragraph.length = 0;
    }

    if (isFenceStart) {
      fenceLanguage = markdownSourceLineContract.parse(
        trimmed.slice(markdownSyntaxStatics.codeFence.length).trim(),
      );
      continue;
    }

    if (isRule) {
      blocks.push(markdownBlockContract.parse({ kind: 'rule' }));
      continue;
    }

    if (heading !== null) {
      blocks.push(
        markdownBlockContract.parse({
          kind: 'heading',
          level: (heading[1] ?? '').length,
          spans: parseMarkdownSpansTransformer({ text: heading[2] ?? '' }),
        }),
      );
      continue;
    }

    if (listItem !== null) {
      const indent = (listItem[1] ?? '').length;
      const marker = listItem[2] ?? '';
      blocks.push(
        markdownBlockContract.parse({
          kind: 'list-item',
          marker: BULLET_MARKER.test(marker) ? markdownSyntaxStatics.bulletGlyph : marker,
          depth: Math.min(
            Math.floor(indent / markdownSyntaxStatics.indentWidth),
            markdownSyntaxStatics.maxListDepth,
          ),
          spans: parseMarkdownSpansTransformer({ text: listItem[3] ?? '' }),
        }),
      );
      continue;
    }

    if (quote !== null) {
      blocks.push(
        markdownBlockContract.parse({
          kind: 'quote',
          spans: parseMarkdownSpansTransformer({ text: quote[1] ?? '' }),
        }),
      );
      continue;
    }

    if (trimmed !== '') {
      paragraph.push(markdownSourceLineContract.parse(trimmed));
    }
  }

  // An unterminated fence is the normal shape of a message still streaming — render what arrived.
  if (fenceLanguage !== null) {
    blocks.push(
      markdownBlockContract.parse({
        kind: 'code-block',
        language: fenceLanguage,
        content: fenced.join('\n'),
      }),
    );
  }

  if (paragraph.length > 0) {
    blocks.push(
      markdownBlockContract.parse({
        kind: 'paragraph',
        spans: parseMarkdownSpansTransformer({ text: paragraph.join(' ') }),
      }),
    );
  }

  return blocks;
};
