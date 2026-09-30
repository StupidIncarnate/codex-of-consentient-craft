/**
 * PURPOSE: Check if file contents contain an exported function declaration
 *
 * USAGE:
 * const hasExport = hasExportedFunctionGuard({ fileContents: FileContentsStub({ value: 'export const foo = () => {}' }) });
 * // Returns true if file has export const
 */


const EXPORT_PATTERN = /export\s+const\s+\w+/u;

export const hasExportedFunctionGuard = ({
  fileContents,
}: {
  fileContents?: string;
}): boolean => {
  if (!fileContents) {
    return false;
  }

  return EXPORT_PATTERN.test(fileContents);
};
