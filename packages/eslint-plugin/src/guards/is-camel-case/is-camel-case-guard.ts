/**
 * PURPOSE: Checks if a string follows camelCase naming convention
 *
 * USAGE:
 * if (isCamelCaseGuard({ str: 'myVariableName' })) {
 *   // String is in camelCase
 * }
 * // Returns true for strings starting with lowercase letter followed by alphanumerics
 */
export const isCamelCaseGuard = ({ str }: { str?: string | undefined }): boolean => {
  if (str === undefined) {
    return false;
  }

  return /^[a-z][a-zA-Z0-9]*$/u.test(str);
};
