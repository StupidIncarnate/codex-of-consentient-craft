/**
 * PURPOSE: Extracts the first exported const or function name from TypeScript source text,
 * regardless of case (PascalCase, camelCase, etc.). Returns null when no match found.
 *
 * USAGE:
 * const name = exportNameExtractTransformer({
 *   source: contentTextContract.parse('export const useQuestQueueBinding = () => {};'),
 * });
 * // Returns ContentText 'useQuestQueueBinding' or null
 *
 * WHEN-TO-USE: Project-map back-reference renderers extracting the primary export from
 * a file to render `packages/<pkg> (<exportName>)` cross-package annotations
 * WHEN-NOT-TO-USE: When full AST accuracy is required — this is a regex heuristic and
 * matches the first `export const|function <name>` statement in source order
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

const EXPORT_PATTERN = /export\s+(?:const|function)\s+([A-Za-z_$][A-Za-z0-9_$]*)/u;

export const exportNameExtractTransformer = ({
  source,
}: {
  source: ContentText;
}): ContentText | null => {
  const match = EXPORT_PATTERN.exec(String(source));
  if (match === null) {
    return null;
  }
  const [, name] = match;
  if (name === undefined || name === '') {
    return null;
  }
  return contentTextContract.parse(name);
};
