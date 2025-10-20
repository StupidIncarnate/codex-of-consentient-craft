/**
 * Checks if a filename ends with a specific suffix pattern.
 * Automatically adds dots and checks both .ts and .tsx extensions.
 *
 * @example
 * hasFileSuffixGuard({ filename: 'foo.proxy.ts', suffix: 'proxy' }) // true
 * hasFileSuffixGuard({ filename: 'foo.stub.tsx', suffix: 'stub' }) // true
 * hasFileSuffixGuard({ filename: 'foo.integration.test.ts', suffix: 'integration.test' }) // true
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
