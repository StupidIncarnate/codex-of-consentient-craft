/**
 * PURPOSE: Checks if a filename ends with a specific suffix pattern, automatically adding dots and checking both .ts and .tsx extensions.
 *
 * USAGE:
 * hasFileSuffixGuard({ filename: 'foo.proxy.ts', suffix: 'proxy' })
 * // Returns true
 */
export const hasFileSuffixGuard = ({
  filename,
  suffix,
}: {
  filename?: string;
  suffix?: string;
}): boolean => {
  if (!filename || !suffix) {
    return false;
  }

  // Construct patterns: .{suffix}.ts and .{suffix}.tsx
  return filename.endsWith(`.${suffix}.ts`) || filename.endsWith(`.${suffix}.tsx`);
};
