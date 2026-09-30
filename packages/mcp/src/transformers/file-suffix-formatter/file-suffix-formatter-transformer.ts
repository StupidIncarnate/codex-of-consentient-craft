/**
 * PURPOSE: Formats file suffix by removing TypeScript extension pattern from suffix string
 *
 * USAGE:
 * const baseName = fileSuffixFormatterTransformer({ suffix: '-broker.ts' });
 * // Returns '-broker'
 */

export const fileSuffixFormatterTransformer = ({ suffix }: { suffix: string }): string => {
  const formatted = suffix.replace(/\.tsx?$/u, '');
  return formatted;
};
