/**
 * PURPOSE: Extracts MCP tool name literals from a flow file source text.
 * Matches `name: '<toolName>' as never` patterns in ToolRegistration array literals.
 *
 * USAGE:
 * const names = mcpToolNamesExtractTransformer({
 *   source: contentTextContract.parse(`[
 *     { name: 'discover' as never, description: '...' as never, inputSchema: ..., handler: ... },
 *   ]`),
 * });
 * // Returns ['discover'] as ContentText[]
 *
 * WHEN-TO-USE: mcp-server headline broker extracting tool names from flow source
 * WHEN-NOT-TO-USE: When full AST parsing is needed — this is a v1 regex heuristic
 */


// Matches: name: 'discover' as never  OR  name: "discover" as never
const TOOL_NAME_PATTERN = /name:\s*['"]([^'"]+)['"]\s*as\s+never/gu;

export const mcpToolNamesExtractTransformer = ({
  source,
}: {
  source: string;
}): string[] => {
  const names: string[] = [];
  TOOL_NAME_PATTERN.lastIndex = 0;
  let match = TOOL_NAME_PATTERN.exec(String(source));
  while (match !== null) {
    const [, name] = match;
    if (name !== undefined) {
      names.push(name);
    }
    match = TOOL_NAME_PATTERN.exec(String(source));
  }
  return names;
};
