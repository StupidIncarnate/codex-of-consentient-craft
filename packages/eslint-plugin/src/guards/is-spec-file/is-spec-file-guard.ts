/**
 * PURPOSE: Determines if a file is a Playwright spec file based on the .spec.ts suffix
 *
 * USAGE:
 * if (isSpecFileGuard({ filename: 'smoke.spec.ts' })) {
 *   // Returns true - file is a spec file
 * }
 * if (isSpecFileGuard({ filename: 'user-broker.test.ts' })) {
 *   // Returns false - not a spec file
 * }
 *
 * WHEN-TO-USE: Use to identify Playwright e2e spec files for e2e-specific lint rules
 */
export const isSpecFileGuard = ({ filename }: { filename?: string | undefined }): boolean => {
  if (filename === undefined) {
    return false;
  }

  return filename.endsWith('.spec.ts');
};
