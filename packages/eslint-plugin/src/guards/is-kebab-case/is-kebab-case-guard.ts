/**
 * PURPOSE: Checks if a string follows kebab-case naming convention
 *
 * USAGE:
 * if (isKebabCaseGuard({ str: 'my-variable-name' })) {
 *   // String is in kebab-case
 * }
 * // Returns true for lowercase strings with hyphens between words
 */
export const isKebabCaseGuard = ({ str }: { str?: string | undefined }): boolean => {
  if (str === undefined) {
    return false;
  }

  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/u.test(str);
};
