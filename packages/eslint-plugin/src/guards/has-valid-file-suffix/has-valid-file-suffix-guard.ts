/**
 * Checks if filename matches the expected suffix pattern.
 */
export const hasValidFileSuffixGuard = ({
  filename,
  fileSuffix,
}: {
  filename?: string | undefined;
  fileSuffix?: string | readonly string[] | undefined;
}): boolean => {
  if (filename === undefined) {
    return false;
  }
  if (fileSuffix === undefined) {
    return false;
  }
  const suffixes = Array.isArray(fileSuffix) ? fileSuffix : [fileSuffix];
  return suffixes.some((suffix: string) => filename.endsWith(suffix));
};
