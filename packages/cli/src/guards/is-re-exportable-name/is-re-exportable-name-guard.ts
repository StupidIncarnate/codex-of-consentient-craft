/**
 * PURPOSE: Whether one name an `export =` package's declarations hold can go in a passthrough's
 * `export { ... } from` list and be read back as `pkgModule.<name>` in its test — a plain identifier
 * other than `default`, which the passthrough re-exports on its own line. A quoted property key such
 * as `'not-an-identifier'` is not one.
 *
 * USAGE:
 * isReExportableNameGuard({ name: 'createElement' });
 * // Returns true
 */

import * as ts from '#gateway/npm/typescript';

const DEFAULT_EXPORT_NAME = 'default';

export const isReExportableNameGuard = ({ name }: { name?: string }): boolean => {
  if (name === undefined || name === DEFAULT_EXPORT_NAME) {
    return false;
  }
  const [first, ...rest] = Array.from(name);
  if (first === undefined) {
    return false;
  }
  return (
    ts.isIdentifierStart(first.codePointAt(0) ?? 0, ts.ScriptTarget.Latest) &&
    rest.every((character) =>
      ts.isIdentifierPart(character.codePointAt(0) ?? 0, ts.ScriptTarget.Latest),
    )
  );
};
