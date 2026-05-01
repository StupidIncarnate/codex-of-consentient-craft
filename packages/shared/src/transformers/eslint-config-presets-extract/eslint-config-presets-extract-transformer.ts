/**
 * PURPOSE: Extracts config preset names from an eslint-plugin source file by matching
 * a configs: { ... } block and extracting all top-level key names from it.
 * Handles nested braces and parentheses in values.
 *
 * USAGE:
 * const presets = eslintConfigPresetsExtractTransformer({
 *   source: ContentTextStub({ value: '... configs: { dungeonmaster: x, dungeonmasterTest: y } ...' }),
 * });
 * // Returns ContentText[] of preset names, e.g. ['dungeonmaster', 'dungeonmasterTest']
 *
 * WHEN-TO-USE: eslint-plugin headline broker rendering the config presets section
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

// Matches the opening "configs: {" position; we then scan forward manually
const CONFIGS_OPEN_PATTERN = /configs\s*:\s*\{/u;
const TOP_LEVEL_KEY_PATTERN = /(?:^|,)\s*['"]?([\w-]+)['"]?\s*:/gu;

export const eslintConfigPresetsExtractTransformer = ({
  source,
}: {
  source: ContentText;
}): ContentText[] => {
  const sourceStr = String(source);

  const openMatch = CONFIGS_OPEN_PATTERN.exec(sourceStr);
  if (openMatch === null) {
    return [];
  }

  // Walk forward from the opening brace to find the balanced closing brace
  let depth = 0;
  let blockStart = -1;
  let blockEnd = -1;
  const configsOpenEnd = openMatch.index + openMatch[0].length - 1;

  for (let i = configsOpenEnd; i < sourceStr.length; i++) {
    const char = sourceStr[i];
    if (char === '{') {
      if (depth === 0) {
        blockStart = i + 1;
      }
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0) {
        blockEnd = i;
        break;
      }
    }
  }

  if (blockStart === -1 || blockEnd === -1) {
    return [];
  }

  // Build a flat representation keeping only top-level chars (depth 0 relative to configs block)
  let nestDepth = 0;
  const flatContent = Array.from(sourceStr.slice(blockStart, blockEnd))
    .map((char) => {
      if (char === '{' || char === '(') {
        nestDepth++;
        return ' ';
      }
      if (char === '}' || char === ')') {
        nestDepth--;
        return ' ';
      }
      return nestDepth === 0 ? char : ' ';
    })
    .join('');

  const results: ContentText[] = [];

  let match = TOP_LEVEL_KEY_PATTERN.exec(flatContent);
  while (match !== null) {
    const [, keyName] = match;
    if (keyName !== undefined) {
      results.push(contentTextContract.parse(keyName));
    }
    match = TOP_LEVEL_KEY_PATTERN.exec(flatContent);
  }

  return results;
};
