/**
 * PURPOSE: Converts kebab-case string to camelCase
 *
 * USAGE:
 * const camelName = kebabToCamelTransformer({
 *   kebabCase: FunctionNameStub({ value: 'has-permission-guard' })
 * });
 * // Returns: FunctionName('hasPermissionGuard')
 */

export const kebabToCamelTransformer = ({ kebabCase }: { kebabCase: string }): string => {
  const camelCase = kebabCase.replace(/-([a-z])/gu, (_, letter: string) => letter.toUpperCase());
  return camelCase;
};
