import type { FunctionName } from '../../contracts/function-name/function-name-contract';
import { functionNameContract } from '../../contracts/function-name/function-name-contract';

/**
 * PURPOSE: Converts kebab-case string to camelCase
 *
 * USAGE:
 * const camelName = kebabToCamelTransformer({
 *   kebabCase: FunctionNameStub({ value: 'has-permission-guard' })
 * });
 * // Returns: FunctionName('hasPermissionGuard')
 */
export const kebabToCamelTransformer = ({
  kebabCase,
}: {
  kebabCase: FunctionName;
}): FunctionName => {
  const camelCase = kebabCase.replace(/-([a-z])/gu, (_, letter: string) => letter.toUpperCase());
  return functionNameContract.parse(camelCase);
};
