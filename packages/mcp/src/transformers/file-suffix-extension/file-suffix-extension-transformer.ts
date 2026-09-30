/**
 * PURPOSE: Reads the TypeScript extension off a folder's file suffix, so companion filenames can
 * carry the same extension the implementation does. Pairs with fileSuffixFormatterTransformer,
 * which returns the other half of the same suffix.
 *
 * USAGE:
 * const extension = fileSuffixExtensionTransformer({ suffix: '-widget.tsx' });
 * // Returns '.tsx'
 */

export const fileSuffixExtensionTransformer = ({ suffix }: { suffix: string }): string => {
  const matched = /\.tsx?$/u.exec(suffix);

  return matched === null ? '' : matched[0];
};
