import { kebabToCamelCaseTransformer } from '../kebab-to-camel-case/kebab-to-camel-case-transformer';

/**
 * Converts a kebab-case string to PascalCase.
 * Example: 'user-widget' -> 'UserWidget'
 */
export const kebabToPascalCaseTransformer = ({ str }: { str: string }): string => {
  const camelCase = kebabToCamelCaseTransformer({ str });
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
};
