/**
 * PURPOSE: Extracts WS event-type literals from orchestrationEventsState.emit({type: '<literal>'})
 * call sites in a source file text using regex.
 *
 * USAGE:
 * const types = wsEmitCallsExtractTransformer({
 *   source: contentTextContract.parse("orchestrationEventsState.emit({ type: 'chat-output', processId });"),
 * });
 * // Returns ['chat-output']
 *
 * WHEN-TO-USE: WS-edges broker scanning orchestrator/server source files for emit sites
 * WHEN-NOT-TO-USE: When full AST parsing is needed — this is a v1 regex heuristic
 */

import type { ContentText } from '../../contracts/content-text/content-text-contract';
import { contentTextContract } from '../../contracts/content-text/content-text-contract';

// Matches: orchestrationEventsState.emit({ type: 'some-literal' or "some-literal"
const EMIT_PATTERN = /orchestrationEventsState\.emit\(\s*\{\s*type:\s*['"]([^'"]+)['"]/gu;

export const wsEmitCallsExtractTransformer = ({
  source,
}: {
  source: ContentText;
}): ContentText[] => {
  const results: ContentText[] = [];
  EMIT_PATTERN.lastIndex = 0;

  let match = EMIT_PATTERN.exec(String(source));
  while (match !== null) {
    const [, captured] = match;
    if (captured !== undefined) {
      results.push(contentTextContract.parse(captured));
    }
    match = EMIT_PATTERN.exec(String(source));
  }

  return results;
};
