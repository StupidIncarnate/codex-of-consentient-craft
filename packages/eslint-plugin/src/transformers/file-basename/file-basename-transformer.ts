/**
 * Extracts the basename from a filename without extension.
 * Example: '/path/to/user-fetch-broker.ts' -> 'user-fetch-broker'
 */
export const fileBasenameTransformer = ({ filename }: { filename: string }): string => {
  const parts = filename.split('/');
  const fileWithExt = parts[parts.length - 1] ?? '';
  return fileWithExt.replace(/\.(ts|tsx|js|jsx)$/u, '');
};
