/**
 * PURPOSE: Searches file contents for matches and returns line-level hits with optional context
 *
 * USAGE:
 * const hits = contentGrepTransformer({ contents: FileContentsStub({ value: 'line1\nERROR here\nline3' }), pattern: GrepPatternStub({ value: 'ERROR' }) });
 * // Returns [{ line: 2, text: 'ERROR here' }]
 *
 * WHEN-TO-USE: Default is literal substring match. Opt into regex via `re:<pattern>` prefix or leading inline flags like `(?i)foo`.
 */
import type { FileContents } from '../../contracts/file-contents/file-contents-contract';
import type { GrepHit } from '../../contracts/grep-hit/grep-hit-contract';
import { grepHitContract } from '../../contracts/grep-hit/grep-hit-contract';
import type { DiscoverInput } from '../../contracts/discover-input/discover-input-contract';
import { compileGrepRegexTransformer } from '../compile-grep-regex/compile-grep-regex-transformer';

type GrepPattern = NonNullable<DiscoverInput['grep']>;
type ContextLines = NonNullable<DiscoverInput['context']>;

export const contentGrepTransformer = ({
  contents,
  pattern,
  context,
}: {
  contents: FileContents;
  pattern: GrepPattern;
  context?: ContextLines;
}): GrepHit[] => {
  const regex = compileGrepRegexTransformer({ pattern });
  const contentsStr = String(contents);
  const lines = contentsStr.split('\n');

  // Scan full file contents so multi-line regex patterns work, then project each
  // match offset onto the 1-based line number it begins on.
  const matchedLines = new Set<GrepHit['line']>();
  for (const match of contentsStr.matchAll(regex)) {
    // Count newlines up to the match offset to derive the line number.
    let lineNumber: GrepHit['line'] = 1 as GrepHit['line'];
    for (const ch of contentsStr.slice(0, match.index)) {
      if (ch === '\n') {
        lineNumber = (lineNumber + 1) as GrepHit['line'];
      }
    }
    matchedLines.add(lineNumber);
  }

  if (matchedLines.size === 0) {
    return [];
  }

  // Expand each matched line by `context` in both directions, deduping via Set.
  const ctx = context ?? 0;
  const resultLines = new Set<GrepHit['line']>();
  for (const line of matchedLines) {
    const start = Math.max(1, line - ctx);
    const end = Math.min(lines.length, line + ctx);
    for (let i = start; i <= end; i++) {
      resultLines.add(i as GrepHit['line']);
    }
  }

  const sorted = Array.from(resultLines).sort((a, b) => a - b);
  return sorted.map((line) => grepHitContract.parse({ line, text: lines[line - 1] ?? '' }));
};
