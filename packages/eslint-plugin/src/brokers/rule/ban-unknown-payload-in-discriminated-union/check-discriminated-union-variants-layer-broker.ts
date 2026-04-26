/**
 * PURPOSE: For a z.discriminatedUnion CallExpression, walks each variant's z.object({...}) shape and reports any property whose value is z.unknown() or z.record(*, z.unknown()), respecting the `Raw`-suffix carve-out.
 *
 * USAGE:
 * checkDiscriminatedUnionVariantsLayerBroker({ node: callExpressionNode, ctx });
 * // Returns AdapterResult; reports `banUnknownPayload` or `banUnknownRecordPayload` for each offending property.
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isAstMethodCallGuard } from '../../../guards/is-ast-method-call/is-ast-method-call-guard';
import { checkResolveSchemaBindingLayerBroker } from './check-resolve-schema-binding-layer-broker';

export const checkDiscriminatedUnionVariantsLayerBroker = ({
  node,
  ctx,
}: {
  node?: Tsestree;
  ctx?: EslintContext;
}): AdapterResult => {
  const result = adapterResultContract.parse({ success: true });

  if (!node || !ctx) return result;
  if (!isAstMethodCallGuard({ node, object: 'z', method: 'discriminatedUnion' })) return result;

  // 2nd argument is the variants array
  const variantsArg = node.arguments?.[1];
  if (!variantsArg || variantsArg.type !== 'ArrayExpression') return result;

  for (const variant of variantsArg.elements ?? []) {
    if (!variant) continue;
    if (!isAstMethodCallGuard({ node: variant, object: 'z', method: 'object' })) continue;

    const [shape] = variant.arguments ?? [];
    if (!shape || shape.type !== 'ObjectExpression') continue;

    for (const prop of shape.properties ?? []) {
      if (prop.type !== 'Property') continue;
      // `Property.value` overlaps with `Literal.value` (typed as unknown) in the contract;
      // cast to Tsestree for the property-value (a Node) shape.
      const value = prop.value as Tsestree | undefined;
      if (!value) continue;

      // Resolve property name from Identifier.name or string Literal.value
      const { key } = prop;
      const nameFromIdentifier =
        key && key.type === 'Identifier' && typeof key.name === 'string'
          ? String(key.name)
          : undefined;
      const nameFromLiteral =
        key && key.type === 'Literal' && typeof key.value === 'string' ? key.value : undefined;
      const name = nameFromIdentifier ?? nameFromLiteral;

      // Carve-out: properties named with `Raw` suffix are allowed
      if (name !== undefined && name.endsWith('Raw')) continue;

      const displayName = name ?? '<computed>';

      // Resolve the schema node: either the property's value directly, or — if the
      // value is an Identifier reference (e.g. `payload: genericPayloadSchema`) — the
      // initializer of its same-file Program-level binding.
      let schemaNode: Tsestree | undefined = value;
      if (value.type === 'Identifier') {
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
        const recordArgs = schemaNode.arguments ?? [];
        let hasUnknown = false;
        for (const arg of recordArgs) {
          if (arg && isAstMethodCallGuard({ node: arg, object: 'z', method: 'unknown' })) {
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

  return result;
};
