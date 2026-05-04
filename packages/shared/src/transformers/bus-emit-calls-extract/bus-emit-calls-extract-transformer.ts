/**
 * PURPOSE: Extracts WS-style event-type literals from `<busExportName>.emit({ type: '<lit>' …`
 * call sites in a source file. Parameterised by the bus's exported symbol name so the
 * scanner is repo-agnostic — it does not assume any particular bus name.
 *
 * USAGE:
 * const types = busEmitCallsExtractTransformer({
 *   source: contentTextContract.parse("myBus.emit({ type: 'chat-output', payload });"),
 *   busExportName: contentTextContract.parse('myBus'),
 * });
 * // Returns ['chat-output']
 *
 * WHEN-TO-USE: Bus emitter-site discovery layer broker scanning per-bus emit calls.
 * WHEN-NOT-TO-USE: When AST-level accuracy is required — this is a regex v1 heuristic.
 */

import type { ContentText } from '../../contracts/content-text/content-text-contract';
import { contentTextContract } from '../../contracts/content-text/content-text-contract';

const ESCAPE_REGEX_PATTERN = /[.*+?^${}()|[\]\\]/gu;

export const busEmitCallsExtractTransformer = ({
  source,
  busExportName,
}: {
  source: ContentText;
  busExportName: ContentText;
}): ContentText[] => {
  const escaped = String(busExportName).replace(ESCAPE_REGEX_PATTERN, '\\$&');
  const pattern = new RegExp(`${escaped}\\.emit\\(\\s*\\{\\s*type:\\s*['"]([^'"]+)['"]`, 'gu');
  const results: ContentText[] = [];
  pattern.lastIndex = 0;

  let match = pattern.exec(String(source));
  while (match !== null) {
    const [, captured] = match;
    if (captured !== undefined) {
      results.push(contentTextContract.parse(captured));
    }
    match = pattern.exec(String(source));
  }

  return results;
};
