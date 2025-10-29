import { kebabCaseStringContract } from '../../contracts/kebab-case-string/kebab-case-string-contract';
import type { KebabCaseString } from '../../contracts/kebab-case-string/kebab-case-string-contract';

/**
 * PURPOSE: Converts any case format (camelCase, PascalCase, snake_case) to kebab-case
 *
 * USAGE:
 * const kebab = toKebabCaseTransformer({ str: 'UserFetchBroker' });
 * // Returns: 'user-fetch-broker'
 *
 * const fromCamel = toKebabCaseTransformer({ str: 'eslintRuleTester' });
 * // Returns: 'eslint-rule-tester'
 *
 * const fromSnake = toKebabCaseTransformer({ str: 'user_fetch_broker' });
 * // Returns: 'user-fetch-broker'
 */
export const toKebabCaseTransformer = ({ str }: { str: string }): KebabCaseString => {
  // Convert camelCase, PascalCase, snake_case, or any mixed case to kebab-case
  const kebabCase = str
    // Insert hyphen before uppercase letters (for camelCase/PascalCase)
    .replace(/([a-z])([A-Z])/gu, '$1-$2')
    // Replace underscores and spaces with hyphens
    .replace(/[_\s]+/gu, '-')
    // Convert to lowercase
    .toLowerCase()
    // Remove any non-alphanumeric characters except hyphens
    .replace(/[^a-z0-9-]/gu, '')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/gu, '')
    // Collapse multiple consecutive hyphens
    .replace(/-+/gu, '-');

  return kebabCaseStringContract.parse(kebabCase);
};
