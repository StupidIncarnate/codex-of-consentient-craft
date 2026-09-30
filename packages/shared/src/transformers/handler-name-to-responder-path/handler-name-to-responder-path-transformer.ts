/**
 * PURPOSE: Derives the conventional file path for an MCP handler responder function name.
 * Converts PascalCase handler names to their kebab-case file paths under src/responders/.
 * Convention: ArchitectureHandleResponder → responders/architecture/handle/architecture-handle-responder.ts
 *
 * USAGE:
 * handlerNameToResponderPathTransformer({
 *   handlerName: contentTextContract.parse('ArchitectureHandleResponder'),
 *   packageSrcPath: absoluteFilePathContract.parse('/repo/packages/mcp/src'),
 * });
 * // Returns AbsoluteFilePath '/repo/packages/mcp/src/responders/architecture/handle/architecture-handle-responder.ts'
 *
 * WHEN-TO-USE: mcp-server headline broker locating the responder file for exemplar tracing
 * WHEN-NOT-TO-USE: When the handler uses a non-standard naming convention
 */

export const handlerNameToResponderPathTransformer = ({
  handlerName,
  packageSrcPath,
}: {
  handlerName: string;
  packageSrcPath: string;
}): string => {
  // Convert PascalCase to kebab-case: ArchitectureHandleResponder → architecture-handle-responder
  const kebab = handlerName
    .replace(/([A-Z])/gu, '-$1')
    .toLowerCase()
    .replace(/^-/u, '');

  // Domain is everything before the first '-handle-' segment
  const handleIdx = kebab.indexOf('-handle-');
  const domain = handleIdx === -1 ? kebab : kebab.slice(0, handleIdx);

  const filePath = `${packageSrcPath}/responders/${domain}/handle/${kebab}.ts`;
  return filePath;
};
