/**
 * PURPOSE: Extracts property key names from an exported namespace object literal in TypeScript
 * source text. Finds `export const \w+ = {` and collects each camelCase property key inside
 * the object body.
 *
 * USAGE:
 * const keys = namespaceObjectKeysExtractTransformer({
 *   source: contentTextContract.parse('export const StartOrchestrator = {\n  listGuilds: async () => [],\n  addGuild: async () => {},\n};'),
 * });
 * // Returns ['listGuilds', 'addGuild'] as ContentText[]
 *
 * WHEN-TO-USE: Extracting the public API method list from programmatic-service startup files
 * WHEN-NOT-TO-USE: When full AST accuracy is required — this is a v1 regex heuristic
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

// Matches the exported namespace object literal header
const NAMESPACE_OBJECT_HEADER_PATTERN = /export\s+const\s+\w+\s*=\s*\{/u;

// Matches camelCase property keys inside the object body (indented lines: `  methodName:`)
const METHOD_KEY_PATTERN = /^\s{2,}([a-z][A-Za-z0-9]*):/gmu;

export const namespaceObjectKeysExtractTransformer = ({
  source,
}: {
  source: ContentText;
}): ContentText[] => {
  const src = String(source);

  const namespaceMatch = NAMESPACE_OBJECT_HEADER_PATTERN.exec(src);
  if (namespaceMatch === null) {
    return [];
  }

  const startIdx = namespaceMatch.index + namespaceMatch[0].length;

  // Walk forward tracking brace depth to find the end of the object literal
  let depth = 1;
  let endIdx = startIdx;
  while (endIdx < src.length && depth > 0) {
    const ch = src[endIdx];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    endIdx++;
  }

  const objectBody = src.slice(startIdx, endIdx - 1);

  const found: ContentText[] = [];
  METHOD_KEY_PATTERN.lastIndex = 0;
  let match = METHOD_KEY_PATTERN.exec(objectBody);
  while (match !== null) {
    const [, methodName] = match;
    if (methodName !== undefined) {
      const parsed = contentTextContract.parse(methodName);
      const alreadySeen = found.some((m) => String(m) === String(parsed));
      if (!alreadySeen) {
        found.push(parsed);
      }
    }
    match = METHOD_KEY_PATTERN.exec(objectBody);
  }
  METHOD_KEY_PATTERN.lastIndex = 0;

  return found;
};
