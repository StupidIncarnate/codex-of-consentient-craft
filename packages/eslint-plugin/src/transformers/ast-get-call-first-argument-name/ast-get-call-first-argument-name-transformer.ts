/**
 * PURPOSE: Extracts the name of the first argument from a CallExpression if it's an Identifier
 *
 * USAGE:
 * const name = astGetCallFirstArgumentNameTransformer({ node: callExpressionNode });
 * // Returns 'Date' for jest.spyOn(Date, 'now'), 'axios' for jest.spyOn(axios, 'get'), or null if not an Identifier
 */
import { identifierContract } from '@dungeonmaster/shared/contracts';
import type { Identifier } from '@dungeonmaster/shared/contracts';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const astGetCallFirstArgumentNameTransformer = ({
  node,
}: {
  node?: TSESTree.Node;
}): Identifier | null => {
  if (node?.type !== AST_NODE_TYPES.CallExpression && node?.type !== AST_NODE_TYPES.NewExpression) {
    return null;
  }

  const [firstArg] = node.arguments;
  if (firstArg?.type === AST_NODE_TYPES.Identifier) {
    return identifierContract.parse(firstArg.name);
  }

  return null;
};
