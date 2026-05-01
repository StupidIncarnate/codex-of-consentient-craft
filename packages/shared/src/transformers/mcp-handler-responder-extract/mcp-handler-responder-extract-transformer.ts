/**
 * PURPOSE: Extracts handler responder function names from MCP flow source text.
 * Matches `handler: async ({ args }) => SomeResponder({` patterns in ToolRegistration
 * array literals. Returns one responder name per tool registration, in declaration order.
 *
 * USAGE:
 * const responders = mcpHandlerResponderExtractTransformer({
 *   source: contentTextContract.parse(`[
 *     { name: 'discover' as never, ..., handler: async ({ args }) => ArchitectureHandleResponder({ tool: 'discover' as never, args }) },
 *   ]`),
 * });
 * // Returns ['ArchitectureHandleResponder'] as ContentText[]
 *
 * WHEN-TO-USE: mcp-server headline broker extracting handler responder names from flow source
 * WHEN-NOT-TO-USE: When full AST parsing is needed — this is a v1 regex heuristic
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

// Matches: handler: async ({ args }) => SomeName({
// Capture group 1 = the responder function name (PascalCase identifier)
const HANDLER_RESPONDER_PATTERN =
  /handler:\s*async\s*\(\s*\{\s*args\s*\}\s*\)\s*=>\s*([A-Z][A-Za-z0-9]*)\s*\(/gu;

export const mcpHandlerResponderExtractTransformer = ({
  source,
}: {
  source: ContentText;
}): ContentText[] => {
  const responders: ContentText[] = [];
  HANDLER_RESPONDER_PATTERN.lastIndex = 0;
  let match = HANDLER_RESPONDER_PATTERN.exec(String(source));
  while (match !== null) {
    const [, responderName] = match;
    if (responderName !== undefined) {
      responders.push(contentTextContract.parse(responderName));
    }
    match = HANDLER_RESPONDER_PATTERN.exec(String(source));
  }
  return responders;
};
