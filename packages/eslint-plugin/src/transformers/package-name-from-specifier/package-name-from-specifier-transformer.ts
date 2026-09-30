/**
 * PURPOSE: Extracts the npm package name portion of a bare (non-relative) import specifier — the
 * scope+name for a scoped package (`@dungeonmaster/npm` from `@dungeonmaster/npm/zod`), or the first
 * segment for an unscoped one (`lodash` from `lodash/fp`). gateway-dependency-declared runs this on a
 * resolved `#gateway/...` target to get the package name it checks against `dependencies`.
 *
 * USAGE:
 * packageNameFromSpecifierTransformer({ specifier: importPathContract.parse('@dungeonmaster/npm/zod') });
 * // Returns '@dungeonmaster/npm' as branded PackageName
 * packageNameFromSpecifierTransformer({ specifier: importPathContract.parse('lodash/fp') });
 * // Returns 'lodash' as branded PackageName
 */

export const packageNameFromSpecifierTransformer = ({
  specifier,
}: {
  specifier: string;
}): string => {
  if (specifier.startsWith('@')) {
    const [scope, name] = specifier.split('/');
    return (name ? `${scope}/${name}` : specifier);
  }

  const [firstSegment] = specifier.split('/');
  return (firstSegment ?? specifier);
};
