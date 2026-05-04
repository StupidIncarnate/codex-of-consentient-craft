/**
 * PURPOSE: Detects whether a TypeScript source file looks like an in-process event-bus
 * state singleton — defined as an exported object literal with both `on` and `emit`
 * members — and returns the export's symbol name. Repo-agnostic by shape.
 *
 * USAGE:
 * const exportName = busStateShapeDetectTransformer({
 *   source: contentTextContract.parse(
 *     'export const myBus = { emit: () => {}, on: () => {} };',
 *   ),
 * });
 * // Returns ContentText 'myBus', or null when the source does not look like a bus.
 *
 * WHEN-TO-USE: Event-bus discovery layer broker scanning `state/` folders for the
 * pub/sub-shape state singletons that drive the project-map's inline bus annotations.
 * WHEN-NOT-TO-USE: When AST-level accuracy is required — this is a regex v1 heuristic
 * that ignores imports/exports outside the first `export const NAME = {…}`.
 */

import type { ContentText } from '../../contracts/content-text/content-text-contract';
import { contentTextContract } from '../../contracts/content-text/content-text-contract';

const EXPORT_CONST_PATTERN = /export\s+const\s+(\w+)\s*=\s*\{/u;
const EMIT_KEY_PATTERN = /\bemit\s*[:(]/u;
const ON_KEY_PATTERN = /\bon\s*[:(]/u;

export const busStateShapeDetectTransformer = ({
  source,
}: {
  source: ContentText;
}): ContentText | null => {
  const sourceStr = String(source);
  if (!EMIT_KEY_PATTERN.test(sourceStr)) return null;
  if (!ON_KEY_PATTERN.test(sourceStr)) return null;
  const match = EXPORT_CONST_PATTERN.exec(sourceStr);
  if (match === null) return null;
  const [, exportName] = match;
  if (exportName === undefined) return null;
  return contentTextContract.parse(exportName);
};
