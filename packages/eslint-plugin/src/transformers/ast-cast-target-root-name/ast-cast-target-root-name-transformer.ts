/**
 * PURPOSE: Reads the leftmost identifier of a cast's target type, looking through single-argument wrappers and qualified names
 *
 * USAGE:
 * const rootName = astCastTargetRootNameTransformer({ node: assertion.typeAnnotation });
 * // Returns 'TSESLint' for TSESLint.RuleContext<string, []>, 'TSESTree' for Partial<TSESTree.CallExpression>,
 * // and null for a keyword type, `never`, `const` or `unknown`
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { identifierContract } from '@dungeonmaster/shared/contracts';
import type { Identifier } from '@dungeonmaster/shared/contracts';

export const astCastTargetRootNameTransformer = ({
  node,
}: {
  node?: TSESTree.Node | undefined;
}): Identifier | null => {
  if (node === undefined) {
    return null;
  }

  if (node.type === AST_NODE_TYPES.Identifier) {
    return identifierContract.parse(node.name);
  }

  if (node.type === AST_NODE_TYPES.TSQualifiedName) {
    return astCastTargetRootNameTransformer({ node: node.left });
  }

  if (node.type !== AST_NODE_TYPES.TSTypeReference) {
    return null;
  }

  // `as const` parses as a type reference named `const`, not as a keyword type
  if (node.typeName.type === AST_NODE_TYPES.Identifier && node.typeName.name === 'const') {
    return null;
  }

  const typeArguments = node.typeArguments?.params ?? [];
  const [onlyArgument] = typeArguments;

  if (typeArguments.length === 1) {
    return astCastTargetRootNameTransformer({ node: onlyArgument });
  }

  return astCastTargetRootNameTransformer({ node: node.typeName });
};
