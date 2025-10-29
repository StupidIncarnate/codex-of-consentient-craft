import { identifierContract } from '@questmaestro/shared/contracts';
import type { Identifier } from '@questmaestro/shared/contracts';

/**
 * PURPOSE: Removes trailing slash from a string (useful for normalizing folder paths)
 *
 * USAGE:
 * const normalized = removeTrailingSlashTransformer({ str: 'contracts/' });
 * // Returns: 'contracts'
 *
 * const alreadyClean = removeTrailingSlashTransformer({ str: 'brokers' });
 * // Returns: 'brokers'
 */
export const removeTrailingSlashTransformer = ({ str }: { str: string }): Identifier => {
  const withoutSlash = str.replace(/\/$/u, '');

  return identifierContract.parse(withoutSlash);
};
