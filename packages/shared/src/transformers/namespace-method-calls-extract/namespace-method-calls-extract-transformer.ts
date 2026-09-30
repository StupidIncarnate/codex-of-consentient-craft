/**
 * PURPOSE: Extracts method names from uppercase-namespaced call sites in TypeScript source text
 * using regex. Matches patterns like `StartOrchestrator.getQuest(` or `MyNamespace.doThing(`.
 *
 * USAGE:
 * const methods = namespaceMethodCallsExtractTransformer({
 *   source: contentTextContract.parse('StartOrchestrator.getQuest({ questId })'),
 * });
 * // Returns ['getQuest'] as ContentText[]
 *
 * WHEN-TO-USE: Extracting method names from adapter files to build DirectCallEdge records
 * WHEN-NOT-TO-USE: When full AST parsing is needed — this is a v1 regex heuristic
 */

// Matches <UppercaseNamespace>.<camelCaseMethod>(
// Capture group 1 = method name
const NAMESPACE_METHOD_PATTERN = /\b[A-Z][A-Za-z0-9]*\.([a-z][A-Za-z0-9]*)\s*\(/gu;

export const namespaceMethodCallsExtractTransformer = ({
  source,
}: {
  source: string;
}): string[] => {
  const found: string[] = [];
  NAMESPACE_METHOD_PATTERN.lastIndex = 0;
  let match = NAMESPACE_METHOD_PATTERN.exec(source);
  while (match !== null) {
    const [, methodName] = match;
    if (methodName !== undefined) {
      const parsed = methodName;
      const alreadySeen = found.some((m) => m === parsed);
      if (!alreadySeen) {
        found.push(parsed);
      }
    }
    match = NAMESPACE_METHOD_PATTERN.exec(source);
  }
  NAMESPACE_METHOD_PATTERN.lastIndex = 0;
  return found;
};
