/**
 * PURPOSE: Maps each named-import identifier in TypeScript source text to its source from-path,
 * so callers can look up where a given imported symbol is defined
 *
 * USAGE:
 * const map = namedImportsToPathMapTransformer({
 *   source: contentTextContract.parse(
 *     "import { QuestStartResponder } from '../../responders/quest/start/quest-start-responder';",
 *   ),
 * });
 * map.get('QuestStartResponder');
 * // Returns ContentText '../../responders/quest/start/quest-start-responder'
 *
 * WHEN-TO-USE: HTTP-edges broker resolving a route's responder identifier (extracted from the
 * handler body) back to the responder file path via the flow's import block
 * WHEN-NOT-TO-USE: When you need every imported path regardless of name — use
 * importStatementsExtractTransformer instead
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

const NAMED_IMPORTS_PATTERN = /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/gu;

export const namedImportsToPathMapTransformer = ({
  source,
}: {
  source: ContentText;
}): Map<ContentText, ContentText> => {
  const result = new Map<ContentText, ContentText>();
  NAMED_IMPORTS_PATTERN.lastIndex = 0;
  let match = NAMED_IMPORTS_PATTERN.exec(String(source));
  while (match !== null) {
    const [, namesBlock, fromPath] = match;
    if (namesBlock !== undefined && fromPath !== undefined) {
      const names = namesBlock.split(',');
      for (const raw of names) {
        const trimmed = raw.trim();
        if (trimmed === '') continue;
        const aliasParts = trimmed.split(/\s+as\s+/u);
        const localName = aliasParts[aliasParts.length - 1];
        if (localName === undefined) continue;
        const cleaned = localName.replace(/^type\s+/u, '').trim();
        if (cleaned === '') continue;
        result.set(contentTextContract.parse(cleaned), contentTextContract.parse(fromPath));
      }
    }
    match = NAMED_IMPORTS_PATTERN.exec(String(source));
  }
  return result;
};
