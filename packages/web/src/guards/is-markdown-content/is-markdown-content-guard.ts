/**
 * PURPOSE: Decides whether a string was AUTHORED as markdown, so a tool result can render formatted
 * rather than verbatim. Only a heading or a fence at column ZERO counts, and that narrowness is the
 * whole point: the transcript also carries diffs, build logs and file bodies, and every softer mark
 * occurs in those by accident — a removed diff line reads as a bullet, `---` reads as a rule, an npm
 * script echo reads as a quote. Guessing wrong is not cosmetic, because the block parser rejoins
 * consecutive lines into one paragraph, so a log rendered as markdown loses its line structure and
 * the reader loses the only copy of the output. Column zero is specifically what excludes a diff OF
 * a markdown file, whose context headings all sit one column in behind the diff's own gutter.
 *
 * USAGE:
 * isMarkdownContentGuard({content: '# Operator\n\nYou own ONE operation item.'});
 * // Returns true
 */

import { markdownSyntaxStatics } from '../../statics/markdown-syntax/markdown-syntax-statics';

const HEADING = /^#{1,6}\s+\S/u;

export const isMarkdownContentGuard = ({ content }: { content?: string }): boolean => {
  if (!content?.includes('\n')) {
    return false;
  }

  return content
    .split('\n')
    .some((line) => HEADING.test(line) || line.startsWith(markdownSyntaxStatics.codeFence));
};
