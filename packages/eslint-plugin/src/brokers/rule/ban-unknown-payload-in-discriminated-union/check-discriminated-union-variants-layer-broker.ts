/**
 * PURPOSE: For a z.discriminatedUnion CallExpression, walks each variant's z.object({...}) shape and reports any property whose value is z.unknown() or z.record(*, z.unknown()), respecting the `Raw`-suffix carve-out.
 *
 * USAGE:
 * checkDiscriminatedUnionVariantsLayerBroker({ node: callExpressionNode, ctx });
 * // Returns void; reports `banUnknownPayload` or `banUnknownRecordPayload` for each offending property.
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isAstMethodCallGuard } from '../../../guards/is-ast-method-call/is-ast-method-call-guard';
import { checkResolveSchemaBindingLayerBroker } from './check-resolve-schema-binding-layer-broker';

export const checkDiscriminatedUnionVariantsLayerBroker = ({
  node,
  ctx,
}: {
  node?: TSESTree.Node;
  ctx?: TSESLint.RuleContext<string, unknown[]>;
}): void => {
  if (!node || !ctx) return;
  if (!isAstMethodCallGuard({ node, object: 'z', method: 'discriminatedUnion' })) return;

  // 2nd argument is the variants array
  const variantsArg =
    node.type === AST_NODE_TYPES.CallExpression || node.type === AST_NODE_TYPES.NewExpression
      ? node.arguments[1]
      : undefined;
  if (!variantsArg || variantsArg.type !== AST_NODE_TYPES.ArrayExpression) return;

  for (const variant of variantsArg.elements) {
    if (!variant) continue;
    if (!isAstMethodCallGuard({ node: variant, object: 'z', method: 'object' })) continue;

    const [shape] =
      (variant.type === AST_NODE_TYPES.CallExpression ||
      variant.type === AST_NODE_TYPES.NewExpression
        ? variant.arguments
        : undefined) ?? [];
    if (!shape || shape.type !== AST_NODE_TYPES.ObjectExpression) continue;

    for (const prop of shape.properties) {
      if (prop.type !== AST_NODE_TYPES.Property) continue;
      const { value } = prop;

      // Resolve property name from Identifier.name or string Literal.value
      const { key } = prop;
      const nameFromIdentifier =
        key.type === AST_NODE_TYPES.Identifier && typeof key.name === 'string'
          ? key.name
          : undefined;
      const nameFromLiteral =
        key.type === AST_NODE_TYPES.Literal && typeof key.value === 'string'
          ? key.value
          : undefined;
      const name = nameFromIdentifier ?? nameFromLiteral;

      // Carve-out: properties named with `Raw` suffix are allowed
      if (name?.endsWith('Raw')) continue;

      const displayName = name ?? '<computed>';

      // Resolve the schema node: either the property's value directly, or — if the
      // value is an Identifier reference (e.g. `payload: genericPayloadSchema`) — the
      // initializer of its same-file Program-level binding.
      let schemaNode: TSESTree.Node | undefined = value;
      if (value.type === AST_NODE_TYPES.Identifier) {
        schemaNode = checkResolveSchemaBindingLayerBroker({ identifierNode: value });
        if (!schemaNode) continue;
      }

      // Direct z.unknown()
      if (isAstMethodCallGuard({ node: schemaNode, object: 'z', method: 'unknown' })) {
        ctx.report({
          node: prop,
          messageId: 'banUnknownPayload',
          data: { propertyName: displayName },
        });
        continue;
      }

      // z.record(<anything>, z.unknown()) — flag if any argument is z.unknown()
      if (isAstMethodCallGuard({ node: schemaNode, object: 'z', method: 'record' })) {
        const recordArgs =
          (schemaNode.type === AST_NODE_TYPES.CallExpression ||
          schemaNode.type === AST_NODE_TYPES.NewExpression
            ? schemaNode.arguments
            : undefined) ?? [];
        let hasUnknown = false;
        for (const arg of recordArgs) {
          if (isAstMethodCallGuard({ node: arg, object: 'z', method: 'unknown' })) {
            hasUnknown = true;
            break;
          }
        }
        if (hasUnknown) {
          ctx.report({
            node: prop,
            messageId: 'banUnknownRecordPayload',
            data: { propertyName: displayName },
          });
        }
      }
    }
  }
};
