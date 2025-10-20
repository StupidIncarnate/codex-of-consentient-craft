/**
 * Checks if a file is in a specific folder type with the expected suffix.
 * Automatically adds dash prefix and checks both .ts and .tsx extensions.
 *
 * @example
 * isFileInFolderTypeGuard({ filename: 'src/contracts/user/user-contract.ts', folderType: 'contracts', suffix: 'contract' }) // true
 * isFileInFolderTypeGuard({ filename: 'src/statics/user/user-statics.ts', folderType: 'statics', suffix: 'statics' }) // true
 * isFileInFolderTypeGuard({ filename: 'src/guards/is-admin/is-admin-guard.ts', folderType: 'guards', suffix: 'guard' }) // true
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
