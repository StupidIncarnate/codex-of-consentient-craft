/**
 * PURPOSE: Resolves a dotted statics member-expression reference (e.g. `apiRoutesStatics.quests.list`)
 * to a string literal by regex-extracting the `as const` object from the statics source file and
 * walking the property chain iteratively.
 *
 * USAGE:
 * const url = staticsPathResolveTransformer({
 *   source: contentTextContract.parse("export const apiRoutesStatics = { quests: { list: '/api/quests' } } as const;"),
 *   dotPath: contentTextContract.parse('apiRoutesStatics.quests.list'),
 * });
 * // Returns '/api/quests' or null if the path cannot be resolved
 *
 * WHEN-TO-USE: HTTP-edges broker resolving statics references from flow files and web broker files
 * WHEN-NOT-TO-USE: For non-statics dotted expressions, or when full AST parsing is needed
 */

import type { ContentText } from '../../contracts/content-text/content-text-contract';
import { contentTextContract } from '../../contracts/content-text/content-text-contract';

// Matches: key: 'value' or key: "value" — for direct string property extraction
const STRING_PROP_PATTERN =
  /['"]?([a-zA-Z0-9_]+)['"]?\s*:\s*'([^']*)'|['"]?([a-zA-Z0-9_]+)['"]?\s*:\s*"([^"]*)"/gu;

export const staticsPathResolveTransformer = ({
  source,
  dotPath,
}: {
  source: ContentText;
  dotPath: ContentText;
}): ContentText | null => {
  const parts = String(dotPath).split('.');
  // parts[0] is the statics object name (e.g. 'apiRoutesStatics'), skip it
  const propertyKeys = parts.slice(1);

  if (propertyKeys.length === 0) {
    return null;
  }

  // Find the top-level `as const` object — everything between the first `{` and its matching `}`
  const sourceText = String(source);
  const firstBrace = sourceText.indexOf('{');
  if (firstBrace === -1) {
    return null;
  }

  // Extract the top-level object body by tracking brace depth
  let depth = 1;
  let pos = firstBrace + 1;
  while (pos < sourceText.length && depth > 0) {
    if (sourceText[pos] === '{') depth += 1;
    else if (sourceText[pos] === '}') depth -= 1;
    pos += 1;
  }

  // currentBody starts as the full object body (between first `{` and its matching `}`)
  let currentBody = sourceText.slice(firstBrace + 1, pos - 1);

  // Walk down the property key chain
  for (let keyIdx = 0; keyIdx < propertyKeys.length; keyIdx += 1) {
    const key = propertyKeys[keyIdx];
    if (key === undefined) {
      return null;
    }

    const isLastKey = keyIdx === propertyKeys.length - 1;

    if (isLastKey) {
      // Look for a direct string assignment: key: 'value' or key: "value"
      STRING_PROP_PATTERN.lastIndex = 0;
      let propMatch = STRING_PROP_PATTERN.exec(currentBody);
      while (propMatch !== null) {
        const [, singleKey, singleVal, doubleKey, doubleVal] = propMatch;
        const matchedKey = singleKey ?? doubleKey;
        const matchedVal = singleVal ?? doubleVal;
        if (matchedKey === key && matchedVal !== undefined) {
          return contentTextContract.parse(matchedVal);
        }
        propMatch = STRING_PROP_PATTERN.exec(currentBody);
      }
      return null;
    }

    // Need to descend into a nested object — find `key: {` and extract its braced body
    const nestedOpenPattern = new RegExp(`['"]?${key}['"]?\\s*:\\s*\\{`, 'u');
    const openMatch = nestedOpenPattern.exec(currentBody);
    if (openMatch === null) {
      return null;
    }

    const bodyStart = openMatch.index + openMatch[0].length;
    let nestDepth = 1;
    let nestPos = bodyStart;
    while (nestPos < currentBody.length && nestDepth > 0) {
      if (currentBody[nestPos] === '{') nestDepth += 1;
      else if (currentBody[nestPos] === '}') nestDepth -= 1;
      nestPos += 1;
    }

    currentBody = currentBody.slice(bodyStart, nestPos - 1);
  }

  return null;
};
