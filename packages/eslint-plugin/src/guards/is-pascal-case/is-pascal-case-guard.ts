/**
 * Checks if a string is in PascalCase format.
 */
export const isPascalCaseGuard = ({ str }: { str?: string | undefined }): boolean => {
  if (str === undefined) {
    return false;
  }

  return /^[A-Z][a-zA-Z0-9]*$/u.test(str);
};
