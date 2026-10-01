/**
 * PURPOSE: Decides whether an expression's value comes from the calling module's own location:
 * `__dirname`, `__filename` or `import.meta` anywhere inside it, or a same-file variable whose
 * initializer does. A variable is followed through `declarations` and each name is followed once,
 * so a cycle ends. An object key or a non-computed member property never counts: in
 * `{ __dirname: x }` or `paths.__dirname` the name is a label, not a value.
 *
 * USAGE:
 * isSelfLocatedExpressionGuard({ node: startDirValue, declarations });
 * // Returns true for `__dirname`, `resolve(__dirname, '..')`, or `ownDir` after `const ownDir = dirname(__filename)`
 *
 * WHEN-TO-USE: Only inside the ban-self-located-repo-lookup rule broker.
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

import { selfLocatedRepoLookupStatics } from '../../statics/self-located-repo-lookup/self-located-repo-lookup-statics';

export const isSelfLocatedExpressionGuard = ({
  node,
  declarations,
  followedNames,
}: {
  node?: TSESTree.Node | null;
  declarations?: Map<string, TSESTree.Node>;
  followedNames?: Set<string>;
}): boolean => {
  if (node === null || node === undefined) {
    return false;
  }
  const knownDeclarations = declarations ?? new Map<string, TSESTree.Node>();
  const followed = followedNames ?? new Set<string>();

  if (node.type === AST_NODE_TYPES.MetaProperty) {
    return node.meta.name === 'import';
  }

  if (node.type === AST_NODE_TYPES.Identifier) {
    const { name } = node;
    if (selfLocatedRepoLookupStatics.selfLocationIdentifiers.some((self) => self === name)) {
      return true;
    }

    const initializer = knownDeclarations.get(name);
    if (initializer === undefined || followed.has(name)) {
      return false;
    }

    return isSelfLocatedExpressionGuard({
      node: initializer,
      declarations: knownDeclarations,
      followedNames: new Set([...followed, name]),
    });
  }

  if (node.type === AST_NODE_TYPES.MemberExpression && !node.computed) {
    return isSelfLocatedExpressionGuard({
      node: node.object,
      declarations: knownDeclarations,
      followedNames: followed,
    });
  }

  if (node.type === AST_NODE_TYPES.Property && !node.computed) {
    return isSelfLocatedExpressionGuard({
      node: node.value,
      declarations: knownDeclarations,
      followedNames: followed,
    });
  }

  return Object.entries(node).some(([key, value]: [string, unknown]) => {
    if (key === 'parent') {
      return false;
    }
    const children: unknown[] = Array.isArray(value) ? value : [value];
    return children.some(
      (child) =>
        typeof child === 'object' &&
        child !== null &&
        'type' in child &&
        isSelfLocatedExpressionGuard({
          node: child as TSESTree.Node,
          declarations: knownDeclarations,
          followedNames: followed,
        }),
    );
  });
};
