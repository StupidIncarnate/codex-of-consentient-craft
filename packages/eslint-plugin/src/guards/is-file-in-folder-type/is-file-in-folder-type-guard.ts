/**
 * PURPOSE: Checks if a file is in a specific folder type with the expected suffix, automatically adding dash prefix and checking both .ts and .tsx extensions.
 *
 * USAGE:
 * isFileInFolderTypeGuard({ filename: 'src/contracts/user/user-contract.ts', folderType: 'contracts', suffix: 'contract' })
 * // Returns true
 */
export const isFileInFolderTypeGuard = ({
  filename,
  folderType,
  suffix,
}: {
  filename?: string;
  folderType?: string;
  suffix?: string;
}): boolean => {
  if (!filename || !folderType || !suffix) {
    return false;
  }

  // Check if file is in the specified folder type
  const isInFolder = filename.includes(`/${folderType}/`);
  if (!isInFolder) {
    return false;
  }

  // Check if filename ends with -{suffix}.ts or -{suffix}.tsx
  return filename.endsWith(`-${suffix}.ts`) || filename.endsWith(`-${suffix}.tsx`);
};
