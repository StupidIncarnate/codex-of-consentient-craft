/**
 * PURPOSE: Extracts WS event-type literals from if (parsed.data.type === '<literal>') consumer
 * branches in a source file text using regex.
 *
 * USAGE:
 * const types = wsConsumeCallsExtractTransformer({
 *   source: contentTextContract.parse("if (parsed.data.type === 'chat-output') {"),
 * });
 * // Returns ['chat-output']
 *
 * WHEN-TO-USE: WS-edges broker scanning server/web source files for event consumer branches
 * WHEN-NOT-TO-USE: When full AST parsing is needed — this is a v1 regex heuristic
 */

import type { ContentText } from '../../contracts/content-text/content-text-contract';
import { contentTextContract } from '../../contracts/content-text/content-text-contract';

// Matches: if (parsed.data.type === 'some-literal' or "some-literal"
const CONSUME_PATTERN = /if\s*\(\s*parsed\.data\.type\s*===\s*['"]([^'"]+)['"]/gu;

export const wsConsumeCallsExtractTransformer = ({
  source,
}: {
  source: ContentText;
}): ContentText[] => {
  const results: ContentText[] = [];
  CONSUME_PATTERN.lastIndex = 0;

  let match = CONSUME_PATTERN.exec(String(source));
  while (match !== null) {
    const [, captured] = match;
    if (captured !== undefined) {
      results.push(contentTextContract.parse(captured));
    }
    match = CONSUME_PATTERN.exec(String(source));
  }

  return results;
};
