/**
 * PURPOSE: Reports whether a TypeScript source file contains a `<busExportName>.on(`
 * call — i.e. subscribes to the bus's events. Parameterised by the bus's exported
 * symbol name so detection is repo-agnostic.
 *
 * USAGE:
 * const subscribes = busOnCallDetectTransformer({
 *   source: contentTextContract.parse('myBus.on({ type, handler });'),
 *   busExportName: contentTextContract.parse('myBus'),
 * });
 * // Returns true
 *
 * WHEN-TO-USE: Bus subscriber-site discovery layer broker.
 * WHEN-NOT-TO-USE: When AST-level accuracy is required — this is a regex v1 heuristic.
 */

import type { ContentText } from '../../contracts/content-text/content-text-contract';

const ESCAPE_REGEX_PATTERN = /[.*+?^${}()|[\]\\]/gu;

export const busOnCallDetectTransformer = ({
  source,
  busExportName,
}: {
  source: ContentText;
  busExportName: ContentText;
}): boolean => {
  const escaped = String(busExportName).replace(ESCAPE_REGEX_PATTERN, '\\$&');
  const pattern = new RegExp(`${escaped}\\.on\\s*\\(`, 'u');
  return pattern.test(String(source));
};
