/**
 * PURPOSE: Returns true when a startup file's content reads the process arguments: 'process.argv', or `argv`
 * imported from the gateway's `#gateway/node/process`
 *
 * USAGE:
 * startupReferencesArgvGuard({ startupFileContent: 'const args = process.argv.slice(2);' });
 * // Returns true — 'process.argv' is present in the content
 */

export const startupReferencesArgvGuard = ({
  startupFileContent,
}: {
  startupFileContent?: string;
}): boolean => {
  if (startupFileContent === undefined) {
    return false;
  }
  return (
    startupFileContent.includes('process.argv') ||
    /import\s*\{[^}]*\bargv\b[^}]*\}\s*from\s*['"]#gateway\/node\/process['"]/u.test(
      startupFileContent,
    )
  );
};
