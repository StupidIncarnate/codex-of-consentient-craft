/**
 * PURPOSE: Converts a kebab-case string to PascalCase
 *
 * USAGE:
 * const pascalCase = kebabToPascalCaseTransformer({ str: 'user-widget' });
 * // Returns 'UserWidget'
 */
import { kebabToCamelCaseTransformer } from '../kebab-to-camel-case/kebab-to-camel-case-transformer';

export const kebabToPascalCaseTransformer = ({ str }: { str: string }): string => {
  const camelCase = kebabToCamelCaseTransformer({ str });
  return (camelCase.charAt(0).toUpperCase() + camelCase.slice(1));
};
