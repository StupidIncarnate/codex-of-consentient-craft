/**
 * PURPOSE: Formats file suffix by removing TypeScript extension pattern from suffix string
 *
 * USAGE:
 * const baseName = fileSuffixFormatterTransformer({ suffix: '-broker.ts' });
 * // Returns '-broker'
 */

import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';

export const fileSuffixFormatterTransformer = ({
  suffix,
}: {
  suffix: ContentText;
}): ContentText => {
  const formatted = suffix.replace(/\.tsx?$/u, '');
  return contentTextContract.parse(formatted);
};
