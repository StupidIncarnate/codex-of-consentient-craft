/**
 * PURPOSE: Converts a kebab-case string to PascalCase
 *
 * USAGE:
 * const pascalCase = kebabToPascalCaseTransformer({ str: 'user-widget' });
 * // Returns 'UserWidget'
 */
import type { Identifier } from '@questmaestro/shared/contracts';
import { identifierContract } from '@questmaestro/shared/contracts';
import { kebabToCamelCaseTransformer } from '../kebab-to-camel-case/kebab-to-camel-case-transformer';

export const kebabToPascalCaseTransformer = ({ str }: { str: string }): Identifier => {
  const camelCase = kebabToCamelCaseTransformer({ str });
  return identifierContract.parse(camelCase.charAt(0).toUpperCase() + camelCase.slice(1));
};
