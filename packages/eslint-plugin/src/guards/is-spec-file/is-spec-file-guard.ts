/**
 * PURPOSE: Determines if a file is a Playwright e2e file based on the .e2e.ts suffix
 *
 * USAGE:
 * if (isSpecFileGuard({ filename: 'smoke.e2e.ts' })) {
 *   // Returns true - file is a Playwright e2e file
 * }
 * if (isSpecFileGuard({ filename: 'user-broker.test.ts' })) {
 *   // Returns false - not a Playwright e2e file
 * }
 *
 * WHEN-TO-USE: Use to identify Playwright e2e files (.e2e.ts) for e2e-specific lint rules
 */
export const isSpecFileGuard = ({ filename }: { filename?: string | undefined }): boolean => {
  if (filename === undefined) {
    return false;
  }

  return filename.endsWith('.e2e.ts');
};
