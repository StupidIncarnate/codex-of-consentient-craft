/**
 * PURPOSE: Checks if a string follows PascalCase naming convention
 *
 * USAGE:
 * if (isPascalCaseGuard({ str: 'MyClassName' })) {
 *   // String is in PascalCase
 * }
 * // Returns true for strings starting with uppercase letter followed by alphanumerics
 */
export const isPascalCaseGuard = ({ str }: { str?: string | undefined }): boolean => {
  if (str === undefined) {
    return false;
  }

  return /^[A-Z][a-zA-Z0-9]*$/u.test(str);
};
