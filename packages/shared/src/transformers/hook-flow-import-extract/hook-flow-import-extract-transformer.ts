/**
 * PURPOSE: Extracts the first import path that points to a flows/ or responders/ folder
 * from TypeScript source text. Used to trace from a startup file to its flow/responder target.
 *
 * USAGE:
 * const flowPath = hookFlowImportExtractTransformer({ source: contentTextContract.parse(src) });
 * // Returns ContentText('../flows/hook-pre-edit/hook-pre-edit-flow') or undefined if none found
 *
 * WHEN-TO-USE: hook-handlers headline renderer tracing startup → flow → responder chain
 * WHEN-NOT-TO-USE: When full AST parsing is needed — this is a v1 regex heuristic
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

const FLOW_IMPORT_PATTERN =
  /import\s+(?:type\s+)?(?:\{[^}]+\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]*(?:flows|responders)[^'"]*)['"]/u;

export const hookFlowImportExtractTransformer = ({
  source,
}: {
  source: ContentText;
}): ContentText | undefined => {
  const match = FLOW_IMPORT_PATTERN.exec(String(source));
  if (match === null) {
    return undefined;
  }
  const [, captured] = match;
  if (captured === undefined) {
    return undefined;
  }
  return contentTextContract.parse(captured);
};
