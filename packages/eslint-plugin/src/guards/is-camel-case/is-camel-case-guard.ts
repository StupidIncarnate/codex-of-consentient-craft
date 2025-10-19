/**
 * Checks if a string is in camelCase format.
 */
export const isCamelCaseGuard = ({ str }: { str?: string | undefined }): boolean => {
  if (str === undefined) {
    return false;
  }

  return /^[a-z][a-zA-Z0-9]*$/u.test(str);
};
