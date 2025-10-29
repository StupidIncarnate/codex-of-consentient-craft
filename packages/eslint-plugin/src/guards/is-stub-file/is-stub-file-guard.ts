/**
 * PURPOSE: Checks if a filename represents a stub file
 *
 * USAGE:
 * if (isStubFileGuard({ filename: 'user-contract.stub.ts' })) {
 *   // File is a stub file
 * }
 * // Returns true if filename matches .stub, .stub.ts, or .stub.tsx pattern
 */
export const isStubFileGuard = ({ filename }: { filename?: string }): boolean => {
  if (!filename) {
    return false;
  }

  return /\.stub(\.tsx?)?$/u.test(filename);
};
