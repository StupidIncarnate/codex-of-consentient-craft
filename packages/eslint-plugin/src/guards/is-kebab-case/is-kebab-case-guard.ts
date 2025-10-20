/**
 * Checks if a string is in kebab-case format.
 */
export const isKebabCaseGuard = ({ str }: { str?: string | undefined }): boolean => {
  if (str === undefined) {
    return false;
  }

  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/u.test(str);
};
