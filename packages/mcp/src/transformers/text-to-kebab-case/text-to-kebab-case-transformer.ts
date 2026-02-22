/**
 * PURPOSE: Transforms text to kebab-case format (lowercase with hyphens)
 *
 * USAGE:
 * const result = textToKebabCaseTransformer({ text: ContentTextStub({ value: 'Add Authentication' }) });
 * // Returns: ContentText('add-authentication')
 */

import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';

const NON_ALPHANUMERIC_PATTERN = /[^a-z0-9]+/gu;
const LEADING_TRAILING_HYPHENS_PATTERN = /^-+|-+$/gu;

export const textToKebabCaseTransformer = ({ text }: { text: ContentText }): ContentText => {
  const kebabCased = text
    .toLowerCase()
    .replace(NON_ALPHANUMERIC_PATTERN, '-')
    .replace(LEADING_TRAILING_HYPHENS_PATTERN, '');

  return contentTextContract.parse(kebabCased);
};
