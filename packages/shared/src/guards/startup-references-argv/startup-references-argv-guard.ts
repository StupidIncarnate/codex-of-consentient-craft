/**
 * PURPOSE: Returns true when a startup file's content contains 'process.argv'
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
  return startupFileContent.includes('process.argv');
};
