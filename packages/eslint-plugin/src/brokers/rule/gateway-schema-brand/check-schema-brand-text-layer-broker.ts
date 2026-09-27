/**
 * PURPOSE: Given a `.brand<'...'>()` CallExpression closing a gateway schema, derives the ONE brand
 * text BR C9 allows — `#Gateway` plus the exact type name the schema checks — from the receiver
 * chain (`z.instanceof(Class)` or `z.custom<T>(check)`), and reports when the literal text differs.
 * An unrecognized receiver shape (anything but those two) is left alone rather than guessed at, so
 * this only ever reports a text it can actually derive, never a false positive on a shape it does
 * not understand.
 *
 * USAGE:
 * checkSchemaBrandTextLayerBroker({ node, context });
 * // Reports 'wrongBrandText' when `z.instanceof(ChildProcess).brand<'#GatewayWrongName'>()`'s
 * // literal does not read '#GatewayChildProcess'
 */
import { adapterResultContract, type AdapterResult } from '@dungeonmaster/shared/contracts';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const checkSchemaBrandTextLayerBroker = ({
  node,
  context,
}: {
  node: Tsestree;
  context: EslintContext;
}): AdapterResult => {
  const result = adapterResultContract.parse({ success: true });
  const receiver = node.callee?.type === 'MemberExpression' ? node.callee.object : undefined;

  if (receiver?.type !== 'CallExpression') {
    return result;
  }

  const receiverCallee = receiver.callee;
  const receiverProperty =
    receiverCallee?.type === 'MemberExpression' && receiverCallee.property?.type === 'Identifier'
      ? receiverCallee.property.name
      : undefined;

  const typeName = (() => {
    if (receiverProperty === 'instanceof') {
      const [classArg] = receiver.arguments ?? [];
      return classArg?.type === 'Identifier' ? classArg.name : undefined;
    }

    if (receiverProperty === 'custom') {
      const typeArgs = receiver.typeArguments ?? receiver.typeParameters;
      const firstParam = typeArgs?.params?.[0];
      return firstParam?.type === 'TSTypeReference' && firstParam.typeName?.type === 'Identifier'
        ? firstParam.typeName.name
        : undefined;
    }

    return undefined;
  })();

  if (typeName === undefined) {
    return result;
  }

  const brandTypeArgs = node.typeArguments ?? node.typeParameters;
  const brandParam = brandTypeArgs?.params?.[0];
  const brandLiteral = brandParam?.type === 'TSLiteralType' ? brandParam.literal : undefined;
  const brandText = brandLiteral?.type === 'Literal' ? brandLiteral.value : undefined;

  if (typeof brandText !== 'string') {
    return result;
  }

  const expectedBrandText = `#Gateway${typeName}`;

  if (brandText !== expectedBrandText) {
    context.report({
      node,
      messageId: 'wrongBrandText',
      data: { brandText, expectedBrandText },
    });
  }

  return result;
};
