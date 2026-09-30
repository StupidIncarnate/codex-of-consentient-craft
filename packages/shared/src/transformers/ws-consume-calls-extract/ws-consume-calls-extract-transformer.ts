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


// Matches: if (parsed.data.type === 'some-literal' or "some-literal"
const CONSUME_PATTERN = /if\s*\(\s*parsed\.data\.type\s*===\s*['"]([^'"]+)['"]/gu;

export const wsConsumeCallsExtractTransformer = ({
  source,
}: {
  source: string;
}): string[] => {
  const results: string[] = [];
  CONSUME_PATTERN.lastIndex = 0;

  let match = CONSUME_PATTERN.exec(String(source));
  while (match !== null) {
    const [, captured] = match;
    if (captured !== undefined) {
      results.push(captured);
    }
    match = CONSUME_PATTERN.exec(String(source));
  }

  return results;
};
