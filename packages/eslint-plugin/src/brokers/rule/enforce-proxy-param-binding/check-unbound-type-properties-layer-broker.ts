/**
 * PURPOSE: Walks a function node's object-pattern parameters and reports every property declared in the parameter's inline type literal that the destructuring pattern never binds
 *
 * USAGE:
 * checkUnboundTypePropertiesLayerBroker({ node: arrowFunctionExpressionNode, ctx });
 * // Reports `unboundProxyParam` for each type-literal property with no matching pattern key
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const checkUnboundTypePropertiesLayerBroker = ({
  node,
  ctx,
}: {
  node?:
    TSESTree.ArrowFunctionExpression | TSESTree.FunctionDeclaration | TSESTree.FunctionExpression;
  ctx?: TSESLint.RuleContext<string, unknown[]>;
}): void => {
  if (!node || !ctx) return;

  for (const param of node.params) {
    // Unwrap a defaulted param, e.g. `({ a }: { a: A } = {})` — the type lives on `.left`.
    const patternNode = param.type === AST_NODE_TYPES.AssignmentPattern ? param.left : param;
    if (patternNode.type !== AST_NODE_TYPES.ObjectPattern) continue;

    const { properties } = patternNode;

    // A rest element consumes every remaining declared property — nothing left to flag.
    const hasRest = properties.some((property) => property.type === AST_NODE_TYPES.RestElement);
    if (hasRest) continue;

    const typeLiteral = patternNode.typeAnnotation?.typeAnnotation;
    if (typeLiteral?.type !== AST_NODE_TYPES.TSTypeLiteral) continue;

    const boundNames = new Set(
      properties.flatMap((property) =>
        property.type === AST_NODE_TYPES.Property && property.key.type === AST_NODE_TYPES.Identifier
          ? [property.key.name]
          : [],
      ),
    );

    for (const member of typeLiteral.members) {
      if (
        member.type !== AST_NODE_TYPES.TSPropertySignature ||
        member.key.type !== AST_NODE_TYPES.Identifier
      )
        continue;

      const propertyName = member.key.name;
      if (boundNames.has(propertyName)) continue;

      ctx.report({
        node: member,
        messageId: 'unboundProxyParam',
        data: { propertyName },
      });
    }
  }
};
