/**
 * PURPOSE: Returns true when a startup file exports a const object literal whose properties include async functions
 *
 * USAGE:
 * startupExportsAsyncNamespaceGuard({ startupFileContent: 'export const StartFoo = { bar: async (...) => { ... } };' });
 * // Returns true — exported object with async function property detected
 */

const EXPORTED_OBJECT_WITH_ASYNC_PATTERN = /export\s+const\s+\w+\s*=\s*\{[\s\S]*?\basync\s+\(/u;

export const startupExportsAsyncNamespaceGuard = ({
  startupFileContent,
}: {
  startupFileContent?: string;
}): boolean => {
  if (startupFileContent === undefined) {
    return false;
  }
  return EXPORTED_OBJECT_WITH_ASYNC_PATTERN.test(startupFileContent);
};
