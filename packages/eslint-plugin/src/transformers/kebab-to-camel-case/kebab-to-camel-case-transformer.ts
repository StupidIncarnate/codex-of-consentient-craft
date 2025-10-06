/**
 * Converts a kebab-case string to camelCase.
 * Example: 'user-fetch-broker' -> 'userFetchBroker'
 */
export const kebabToCamelCaseTransformer = ({ str }: { str: string }): string =>
  str.replace(/-([a-z])/gu, (match) => {
    const [, letter] = match.split('');
    return (letter ?? '').toUpperCase();
  });
