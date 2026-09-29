/**
 * PURPOSE: Tells whether a Program node holds only `export ... from` statements, the one shape a package barrel may take. A file with any declaration, import, local export or default export is an implementation file, whatever it is named.
 *
 * USAGE:
 * isReexportOnlyProgramGuard({ node: programNode });
 * // Returns true for `export * from './a'; export type { B } from './b';`
 */
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';
import { tsestreeNodeTypeStatics } from '../../statics/tsestree-node-type/tsestree-node-type-statics';

export const isReexportOnlyProgramGuard = ({ node }: { node?: Tsestree }): boolean => {
  const body = node?.body;

  if (!Array.isArray(body)) {
    return false;
  }

  return body.every((statement) => {
    if (statement.type === tsestreeNodeTypeStatics.nodeTypes.ExportAllDeclaration) {
      return true;
    }

    return (
      statement.type === tsestreeNodeTypeStatics.nodeTypes.ExportNamedDeclaration &&
      !statement.declaration &&
      Boolean(statement.source)
    );
  });
};
