/**
 * PURPOSE: Joins a relative import specifier (`./x`, `../y/z`) onto the absolute directory of the
 * file that imported it, resolving every `.` and `..` segment — the same job Node's module
 * resolver does before it ever touches the filesystem. Kept as a pure string transform (not the
 * `path` module) so the platform-crossing walk stays inside brokers/transformers/guards, which may
 * not import Node builtins directly.
 *
 * USAGE:
 * resolveRelativeSpecifierTransformer({fromDir: '/repo/packages/web/src/widgets', specifier: '../shared/foo'});
 * // Returns: '/repo/packages/web/src/shared/foo' as FilePath
 */

export const resolveRelativeSpecifierTransformer = ({
  fromDir,
  specifier,
}: {
  fromDir: string;
  specifier: string;
}): string => {
  const combinedSegments = [...fromDir.split('/'), ...specifier.split('/')];

  const normalizedSegments = combinedSegments.reduce<typeof combinedSegments>(
    (segments, segment) => {
      if (segment === '' || segment === '.') {
        return segments;
      }
      if (segment === '..') {
        segments.pop();
        return segments;
      }
      segments.push(segment);
      return segments;
    },
    [],
  );

  return `/${normalizedSegments.join('/')}`;
};
