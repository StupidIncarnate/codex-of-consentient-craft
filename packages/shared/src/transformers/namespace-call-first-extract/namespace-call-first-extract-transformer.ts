/**
 * PURPOSE: Extracts the first `Namespace.method({...})` call token from source text,
 * where Namespace begins with an uppercase letter. Returns null when none is found.
 *
 * USAGE:
 * namespaceCallFirstExtractTransformer({
 *   source: contentTextContract.parse('return StartOrchestrator.startQuest({ questId })'),
 * });
 * // Returns ContentText 'StartOrchestrator.startQuest({...})'
 *
 * WHEN-TO-USE: http-backend headline renderer rendering the cross-package method call
 * on the `→ Namespace.method({...})` line of a route entry
 * WHEN-NOT-TO-USE: When all namespace calls are needed (use namespaceMethodCallsExtractTransformer)
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';
import { namespaceMethodCallsExtractTransformer } from '../namespace-method-calls-extract/namespace-method-calls-extract-transformer';
import { namespaceNameExtractTransformer } from '../namespace-name-extract/namespace-name-extract-transformer';

export const namespaceCallFirstExtractTransformer = ({
  source,
}: {
  source: ContentText;
}): ContentText | null => {
  const ns = namespaceNameExtractTransformer({ source });
  if (ns === null) {
    return null;
  }
  const methods = namespaceMethodCallsExtractTransformer({ source });
  const [firstMethod] = methods;
  if (firstMethod === undefined) {
    return null;
  }
  return contentTextContract.parse(`${String(ns)}.${String(firstMethod)}({...})`);
};
