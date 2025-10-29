/**
 * PURPOSE: Converts a kebab-case string to camelCase
 *
 * USAGE:
 * const camelCase = kebabToCamelCaseTransformer({ str: 'user-fetch-broker' });
 * // Returns 'userFetchBroker'
 */
import type { Identifier } from '@questmaestro/shared/contracts';
import { identifierContract } from '@questmaestro/shared/contracts';

export const kebabToCamelCaseTransformer = ({ str }: { str: string }): Identifier =>
  identifierContract.parse(
    str.replace(/-([a-z])/gu, (match) => {
      const [, letter] = match.split('');
      return (letter ?? '').toUpperCase();
    }),
  );
