/**
 * Checks if filename matches the expected suffix pattern.
 */
export const hasValidFileSuffixGuard = ({
  filename,
  fileSuffix,
}: {
  filename: string;
  fileSuffix: string | readonly string[];
}): boolean => {
  const suffixes = Array.isArray(fileSuffix) ? fileSuffix : [fileSuffix];
  return suffixes.some((suffix: string) => filename.endsWith(suffix));
};
