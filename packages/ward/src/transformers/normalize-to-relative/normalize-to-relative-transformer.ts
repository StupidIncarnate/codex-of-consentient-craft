/**
 * PURPOSE: Normalizes a file path to a relative path by stripping a cwd prefix if present
 *
 * USAGE:
 * normalizeToRelativeTransformer({ filePath: gitRelativePathContract.parse('/project/src/a.ts'), cwd: absoluteFilePathContract.parse('/project') });
 * // Returns: GitRelativePath 'src/a.ts'
 */



export const normalizeToRelativeTransformer = ({
  filePath,
  cwd,
}: {
  filePath: string;
  cwd: string;
}): string => {
  const fileString = String(filePath);
  const cwdString = String(cwd);
  const cwdPrefix = cwdString.endsWith('/') ? cwdString : `${cwdString}/`;

  if (fileString.startsWith(cwdPrefix)) {
    return fileString.slice(cwdPrefix.length);
  }

  return filePath;
};
