/**
 * PURPOSE: Converts a kebab-case string to camelCase
 *
 * USAGE:
 * const camelCase = kebabToCamelCaseTransformer({ str: 'user-fetch-broker' });
 * // Returns 'userFetchBroker'
 */

export const kebabToCamelCaseTransformer = ({ str }: { str: string }): string =>
  str.replace(/-([a-z])/gu, (match) => {
      const [, letter] = match.split('');
      return (letter ?? '').toUpperCase();
    });
