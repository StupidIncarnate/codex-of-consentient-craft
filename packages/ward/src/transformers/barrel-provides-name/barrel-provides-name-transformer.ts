/**
 * PURPOSE: Answers whether a parsed module's shape provides a requested export name, for narrowing
 * a `star` dependency edge (`export * from 'x'`) down to only the targets an ancestor's named
 * import could actually reach. Checks one level only — the target's own local exports and its own
 * named re-exports — so a barrel-of-barrels answers `'unknown'` rather than `'no'`, which keeps the
 * walk from dropping a real crossing it could not fully rule out. `followups.md` documents this as
 * the one place deeper barrel nesting still falls back to following everything.
 *
 * USAGE:
 * barrelProvidesNameTransformer({moduleShape: TypescriptModuleShapeStub({localExportNames: ['userFetchBroker']}), name: 'userFetchBroker'});
 * // Returns: 'yes'
 */

import type { TypescriptModuleShape } from '../../contracts/typescript-module-shape/typescript-module-shape-contract';

export const barrelProvidesNameTransformer = ({
  moduleShape,
  name,
}: {
  moduleShape: TypescriptModuleShape;
  name: string;
}): 'yes' | 'no' | 'unknown' => {
  if (moduleShape.localExportNames.some((exportedName) => exportedName === name)) {
    return 'yes';
  }

  const namedMatch = moduleShape.dependencies.some(
    (dependency) =>
      dependency.kind === 'named' &&
      dependency.importedNames.some((importedName) => importedName === name),
  );
  if (namedMatch) {
    return 'yes';
  }

  const hasUnresolvedEdge = moduleShape.dependencies.some(
    (dependency) => dependency.kind === 'star' || dependency.kind === 'opaque',
  );

  return hasUnresolvedEdge ? 'unknown' : 'no';
};
