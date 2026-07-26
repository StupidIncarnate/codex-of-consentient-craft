/**
 * PURPOSE: Walks a function node's object-pattern parameters and reports every property declared in the parameter's inline type literal that the destructuring pattern never binds
 *
 * USAGE:
 * checkUnboundTypePropertiesLayerBroker({ node: arrowFunctionExpressionNode, ctx });
 * // Reports `unboundProxyParam` for each type-literal property with no matching pattern key
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const checkUnboundTypePropertiesLayerBroker = ({
  node,
  ctx,
}: {
  node?: Tsestree;
  ctx?: EslintContext;
}): AdapterResult => {
  const result = adapterResultContract.parse({ success: true });

  if (!node || !ctx) return result;

  for (const param of node.params ?? []) {
    // Unwrap a defaulted param, e.g. `({ a }: { a: A } = {})` — the type lives on `.left`.
    const patternNode = param.type === 'AssignmentPattern' ? param.left : param;
    if (!patternNode || patternNode.type !== 'ObjectPattern') continue;

    const properties = patternNode.properties ?? [];

    // A rest element consumes every remaining declared property — nothing left to flag.
    const hasRest = properties.some((property) => property.type === 'RestElement');
    if (hasRest) continue;

    const typeLiteral = patternNode.typeAnnotation?.typeAnnotation;
    if (!typeLiteral || typeLiteral.type !== 'TSTypeLiteral') continue;

    const boundNames = new Set(
      properties
        .filter((property) => property.type === 'Property' && property.key?.type === 'Identifier')
        .map((property) => String(property.key?.name)),
    );

    for (const member of typeLiteral.members ?? []) {
      if (member.type !== 'TSPropertySignature' || member.key?.type !== 'Identifier') continue;

      const propertyName = String(member.key.name);
      if (boundNames.has(propertyName)) continue;

      ctx.report({
        node: member,
        messageId: 'unboundProxyParam',
        data: { propertyName },
      });
    }
  }

  return result;
};
