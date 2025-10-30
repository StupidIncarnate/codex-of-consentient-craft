/**
 * PURPOSE: Escapes special regex characters in a string for safe regex usage
 *
 * USAGE:
 * const escaped = regexEscapeTransformer({ str: 'a.b*c' });
 * // Returns 'a\\.b\\*c' with regex special characters escaped
 */
export const regexEscapeTransformer = ({ str }: { str: string }): string =>
  str.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
