import type { Identifier } from '@questmaestro/shared/contracts';
import { identifierContract } from '@questmaestro/shared/contracts';
import { kebabToCamelCaseTransformer } from '../kebab-to-camel-case/kebab-to-camel-case-transformer';

/**
 * Converts a kebab-case string to PascalCase.
 * Example: 'user-widget' -> 'UserWidget'
 */
export const kebabToPascalCaseTransformer = ({ str }: { str: string }): Identifier => {
  const camelCase = kebabToCamelCaseTransformer({ str });
  return identifierContract.parse(camelCase.charAt(0).toUpperCase() + camelCase.slice(1));
};
