/**
 * Checks if a string is in camelCase format.
 */
export const isCamelCaseGuard = ({ str }: { str: string }): boolean =>
  /^[a-z][a-zA-Z0-9]*$/u.test(str);
