/**
 * PURPOSE: Extracts the first segment from a kebab-case string before the first dash
 *
 * USAGE:
 * const segment = extractFirstSegmentTransformer({ str: 'user-fetch-broker' });
 * // Returns 'user'
 * const segment2 = extractFirstSegmentTransformer({ str: 'config' });
 * // Returns 'config'
 *
 * WHEN-TO-USE: When extracting domain names from kebab-case file names
 */
import { identifierContract } from '@questmaestro/shared/contracts';
import type { Identifier } from '@questmaestro/shared/contracts';

export const extractFirstSegmentTransformer = ({ str }: { str: string }): Identifier => {
  const match = /^([^-]+)/u.exec(str);
  const segment = match ? match[1] : '';

  return identifierContract.parse(segment);
};
