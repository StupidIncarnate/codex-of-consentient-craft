/**
 * PURPOSE: Extracts property key names from an exported namespace object literal in TypeScript
 * source text. Finds `export const \w+ = {` and collects each camelCase property key that sits
 * at brace-depth-1 inside the object body (skipping nested type-annotation or destructure
 * objects so parameter names like `{ guildId, questId }` aren't returned as methods).
 *
 * USAGE:
 * const keys = namespaceObjectKeysExtractTransformer({
 *   source: contentTextContract.parse('export const StartOrchestrator = {\n  listGuilds: async () => [],\n  addGuild: async ({name}: {name: GuildName}) => {},\n};'),
 * });
 * // Returns ['listGuilds', 'addGuild'] — `name` is filtered out because it sits inside a
 * // nested `{name}` destructure / `{name: GuildName}` type-annotation block, not at depth 1.
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

// Matches a camelCase property key at the start of a line (after leading whitespace)
const TOP_LEVEL_KEY_PATTERN = /^(\s+)([a-z][A-Za-z0-9]*):/u;

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

  // Walk character-by-character so we can both (a) find the end of the namespace literal and
  // (b) track which lines sit at brace-depth-1 (immediate properties of the namespace).
  const found: ContentText[] = [];
  let depth = 1;
  let lineStart = startIdx;
  for (let i = startIdx; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === '\n') {
      lineStart = i + 1;
      continue;
    }
    if (ch === '{') {
      depth += 1;
      continue;
    }
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) break;
      continue;
    }
    // Only consider key matches at the start of a line while at depth 1 (so nested
    // parameter destructures and type annotations are skipped).
    if (depth !== 1) continue;
    // Skip if we're not still examining the line's leading whitespace
    if (i !== lineStart) continue;
    const lineSlice = src.slice(lineStart);
    const match = TOP_LEVEL_KEY_PATTERN.exec(lineSlice);
    if (match === null) {
      // Skip past this line's content; depth tracking handles nested objects on other lines.
      continue;
    }
    const [whole, , methodName] = match;
    if (methodName !== undefined) {
      const parsed = contentTextContract.parse(methodName);
      const alreadySeen = found.some((m) => String(m) === String(parsed));
      if (!alreadySeen) {
        found.push(parsed);
      }
    }
    // Advance past the matched key so we don't re-enter the line-start branch.
    i += whole.length - 1;
  }

  return found;
};
