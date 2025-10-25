import type { Identifier } from '@questmaestro/shared/contracts';
import { identifierContract } from '@questmaestro/shared/contracts';

/**
 * Converts a kebab-case string to camelCase.
 * Example: 'user-fetch-broker' -> 'userFetchBroker'
 */
export const kebabToCamelCaseTransformer = ({ str }: { str: string }): Identifier =>
  identifierContract.parse(
    str.replace(/-([a-z])/gu, (match) => {
      const [, letter] = match.split('');
      return (letter ?? '').toUpperCase();
    }),
  );
