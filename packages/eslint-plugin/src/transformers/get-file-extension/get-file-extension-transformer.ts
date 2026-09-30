/**
 * PURPOSE: Determines the TypeScript file extension (.ts or .tsx) from a filename
 *
 * USAGE:
 * const ext = getFileExtensionTransformer({ filename: 'user-widget.tsx' });
 * // Returns: '.tsx'
 *
 * const extWithoutDot = getFileExtensionTransformer({ filename: 'user-broker.ts', includesDot: false });
 * // Returns: 'ts'
 */

export const getFileExtensionTransformer = ({
  filename,
  includesDot = true,
}: {
  filename: string;
  includesDot?: boolean;
}): string => {
  const isTsx = filename.endsWith('.tsx');
  const extension = isTsx ? 'tsx' : 'ts';

  return includesDot ? `.${extension}` : extension;
};
