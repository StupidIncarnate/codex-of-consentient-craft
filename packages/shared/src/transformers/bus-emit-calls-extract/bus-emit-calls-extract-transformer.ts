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

const ESCAPE_REGEX_PATTERN = /[.*+?^${}()|[\]\\]/gu;

export const busEmitCallsExtractTransformer = ({
  source,
  busExportName,
}: {
  source: string;
  busExportName: string;
}): string[] => {
  const escaped = busExportName.replace(ESCAPE_REGEX_PATTERN, '\\$&');
  const pattern = new RegExp(`${escaped}\\.emit\\(\\s*\\{\\s*type:\\s*['"]([^'"]+)['"]`, 'gu');
  const results: string[] = [];
  pattern.lastIndex = 0;

  let match = pattern.exec(source);
  while (match !== null) {
    const [, captured] = match;
    if (captured !== undefined) {
      results.push(captured);
    }
    match = pattern.exec(source);
  }

  return results;
};
