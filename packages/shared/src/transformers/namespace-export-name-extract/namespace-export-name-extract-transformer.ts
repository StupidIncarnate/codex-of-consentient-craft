/**
 * PURPOSE: Extracts the exported const name from an `export const <Name> = {` namespace object
 * literal in TypeScript source text.
 *
 * USAGE:
 * const name = namespaceExportNameExtractTransformer({
 *   source: contentTextContract.parse('export const StartOrchestrator = { listGuilds: async () => [] };'),
 * });
 * // Returns ContentText 'StartOrchestrator' or null when no matching export found
 *
 * WHEN-TO-USE: Extracting the public namespace name from programmatic-service startup files
 * WHEN-NOT-TO-USE: When full AST accuracy is required — this is a v1 regex heuristic
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

// Matches `export const <Name> = {` — captures the const name
const NAMESPACE_EXPORT_PATTERN = /export\s+const\s+([A-Z][A-Za-z0-9]*)\s*=/u;

export const namespaceExportNameExtractTransformer = ({
  source,
}: {
  source: ContentText;
}): ContentText | null => {
  const match = NAMESPACE_EXPORT_PATTERN.exec(String(source));
  if (match === null) {
    return null;
  }
  const [, name] = match;
  if (name === undefined || name === '') {
    return null;
  }
  return contentTextContract.parse(name);
};
