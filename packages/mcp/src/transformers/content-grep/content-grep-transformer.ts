/**
 * PURPOSE: Matches regex pattern against file contents and returns line-level hits with optional context
 *
 * USAGE:
 * const hits = contentGrepTransformer({ contents: FileContentsStub({ value: 'line1\nERROR here\nline3' }), pattern: GrepPatternStub({ value: 'ERROR' }) });
 * // Returns [{ line: 2, text: 'ERROR here' }]
 */
import type { FileContents } from '../../contracts/file-contents/file-contents-contract';
import type { GrepHit } from '../../contracts/grep-hit/grep-hit-contract';
import { grepHitContract } from '../../contracts/grep-hit/grep-hit-contract';
import type { DiscoverInput } from '../../contracts/discover-input/discover-input-contract';

type GrepPattern = NonNullable<DiscoverInput['grep']>;
type ContextLines = NonNullable<DiscoverInput['context']>;

const INLINE_FLAGS_PATTERN = /^\(\?([gimsuy]+)\)/u;
const REGEX_METACHAR_PATTERN = /[.*+?^${}()|[\]\\]/gu;

export const contentGrepTransformer = ({
  contents,
  pattern,
  context,
}: {
  contents: FileContents;
  pattern: GrepPattern;
  context?: ContextLines;
}): GrepHit[] => {
  const regex = ((): RegExp => {
    try {
      const flagMatch = INLINE_FLAGS_PATTERN.exec(String(pattern));
      const extractedFlags = flagMatch ? flagMatch[1] : '';
      const cleanPattern = flagMatch ? String(pattern).slice(flagMatch[0].length) : String(pattern);
      const flags = `u${extractedFlags ?? ''}`;
      return new RegExp(cleanPattern, flags);
    } catch {
      // Invalid regex — fall back to literal string match by escaping all metacharacters
      const escaped = String(pattern).replace(REGEX_METACHAR_PATTERN, '\\$&');
      return new RegExp(escaped, 'u');
    }
  })();

  const lines = String(contents).split('\n');
  const matchIndices: GrepHit['line'][] = [];

  for (const [index, line] of lines.entries()) {
    if (regex.test(line)) {
      matchIndices.push(index as GrepHit['line']);
    }
  }

  if (matchIndices.length === 0) {
    return [];
  }

  if (context === undefined || context === 0) {
    return matchIndices.map((i) => grepHitContract.parse({ line: i + 1, text: lines[i] }));
  }

  // Expand ranges with context and dedup overlapping
  const resultIndices = new Set<GrepHit['line']>();

  for (const matchIndex of matchIndices) {
    const start = Math.max(0, matchIndex - context);
    const end = Math.min(lines.length - 1, matchIndex + context);
    for (let i = start; i <= end; i++) {
      resultIndices.add(i as GrepHit['line']);
    }
  }

  const sortedIndices = Array.from(resultIndices).sort((a, b) => a - b);

  return sortedIndices.map((i) => grepHitContract.parse({ line: i + 1, text: lines[i] }));
};
