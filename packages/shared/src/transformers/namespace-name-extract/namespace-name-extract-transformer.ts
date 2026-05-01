/**
 * PURPOSE: Extracts the first uppercase namespace identifier from source text —
 * the leading name in a `Namespace.method(` call pattern.
 *
 * USAGE:
 * namespaceNameExtractTransformer({
 *   source: contentTextContract.parse('return StartOrchestrator.startQuest({ questId })'),
 * });
 * // Returns ContentText 'StartOrchestrator'
 *
 * WHEN-TO-USE: http-backend headline renderer resolving the cross-package namespace name
 * for adapter source files that delegate to `<Namespace>.<method>(...)` calls
 * WHEN-NOT-TO-USE: When the full `Namespace.method({...})` token is needed
 * (use namespaceCallFirstExtractTransformer)
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

// Matches the first UppercaseNamespace segment before a dot-method call
const NAMESPACE_PATTERN = /\b([A-Z][A-Za-z0-9]*)\.(?:[a-z][A-Za-z0-9]*)\s*\(/u;

export const namespaceNameExtractTransformer = ({
  source,
}: {
  source: ContentText;
}): ContentText | null => {
  const match = NAMESPACE_PATTERN.exec(String(source));
  if (match === null) {
    return null;
  }
  const [, ns] = match;
  if (ns === undefined || ns === '') {
    return null;
  }
  return contentTextContract.parse(ns);
};
