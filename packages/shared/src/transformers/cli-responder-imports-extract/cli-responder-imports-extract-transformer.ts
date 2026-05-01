/**
 * PURPOSE: Extracts responder import names (identifiers ending in `Responder`) from
 * TypeScript source text by matching `import { SomeResponder } from '...'` patterns.
 *
 * USAGE:
 * const names = cliResponderImportsExtractTransformer({ source: contentTextContract.parse(src) });
 * // Returns ['WardRunResponder', 'WardDetailResponder'] as ContentText[]
 *
 * WHEN-TO-USE: cli-tool headline renderer pairing subcommand literals with responder targets
 * WHEN-NOT-TO-USE: When full AST parsing is needed — this is a v1 regex heuristic
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

// Matches: import { SomeResponder } from '../../responders/..'
const RESPONDER_IMPORT_PATTERN = /import\s+\{\s*(\w+Responder)\s*\}\s+from\s+['"][^'"]*['"]/gu;

export const cliResponderImportsExtractTransformer = ({
  source,
}: {
  source: ContentText;
}): ContentText[] => {
  const names: ContentText[] = [];
  RESPONDER_IMPORT_PATTERN.lastIndex = 0;
  let match = RESPONDER_IMPORT_PATTERN.exec(String(source));
  while (match !== null) {
    const [, name] = match;
    if (name !== undefined) {
      const parsed = contentTextContract.parse(name);
      const alreadySeen = names.some((n) => String(n) === String(parsed));
      if (!alreadySeen) {
        names.push(parsed);
      }
    }
    match = RESPONDER_IMPORT_PATTERN.exec(String(source));
  }
  return names;
};
