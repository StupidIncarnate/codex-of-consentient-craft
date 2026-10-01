/**
 * PURPOSE: The npm package a bare import specifier reaches into — the first path segment, or the
 * first two for a scoped name — so a subpath import (`hono/utils/http-status`) and the package's
 * own root import (`hono`) are checked against the same declared dependency.
 *
 * USAGE:
 * npmPackageNameFromSpecifierTransformer({ specifier: '@modelcontextprotocol/sdk/types.js' });
 * // Returns '@modelcontextprotocol/sdk'
 */

const SCOPE_PREFIX = '@';
const SEGMENT_SEPARATOR = '/';
const SCOPED_SEGMENT_COUNT = 2;

export const npmPackageNameFromSpecifierTransformer = ({
  specifier,
}: {
  specifier: string;
}): string => {
  const segments = specifier.split(SEGMENT_SEPARATOR);
  const segmentCount = specifier.startsWith(SCOPE_PREFIX) ? SCOPED_SEGMENT_COUNT : 1;
  return segments.slice(0, segmentCount).join(SEGMENT_SEPARATOR);
};
