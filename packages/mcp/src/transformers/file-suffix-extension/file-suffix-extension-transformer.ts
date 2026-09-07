/**
 * PURPOSE: Reads the TypeScript extension off a folder's file suffix, so companion filenames can
 * carry the same extension the implementation does. Pairs with fileSuffixFormatterTransformer,
 * which returns the other half of the same suffix.
 *
 * USAGE:
 * const extension = fileSuffixExtensionTransformer({ suffix: '-widget.tsx' });
 * // Returns '.tsx'
 */

import { contentTextContract } from '../../contracts/content-text/content-text-contract';
import type { ContentText } from '../../contracts/content-text/content-text-contract';

export const fileSuffixExtensionTransformer = ({
  suffix,
}: {
  suffix: ContentText;
}): ContentText => {
  const matched = /\.tsx?$/u.exec(suffix);

  return contentTextContract.parse(matched === null ? '' : matched[0]);
};
