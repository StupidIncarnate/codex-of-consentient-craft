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
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const checkSchemaBrandTextLayerBroker = ({
  node,
  context,
}: {
  node: TSESTree.CallExpression;
  context: TSESLint.RuleContext<string, unknown[]>;
}): void => {
  const receiver =
    node.callee.type === AST_NODE_TYPES.MemberExpression ? node.callee.object : undefined;

  if (receiver?.type !== AST_NODE_TYPES.CallExpression) {
    return;
  }

  const receiverCallee = receiver.callee;
  const receiverProperty =
    receiverCallee.type === AST_NODE_TYPES.MemberExpression &&
    receiverCallee.property.type === AST_NODE_TYPES.Identifier
      ? receiverCallee.property.name
      : undefined;

  const typeName = (() => {
    if (receiverProperty === 'instanceof') {
      const [classArg] = receiver.arguments;
      return classArg?.type === AST_NODE_TYPES.Identifier ? classArg.name : undefined;
    }

    if (receiverProperty === 'custom') {
      const typeArgs = receiver.typeArguments;
      const firstParam = typeArgs?.params[0];
      return firstParam?.type === AST_NODE_TYPES.TSTypeReference &&
        firstParam.typeName.type === AST_NODE_TYPES.Identifier
        ? firstParam.typeName.name
        : undefined;
    }

    return undefined;
  })();

  if (typeName === undefined) {
    return;
  }

  const brandParam = node.typeArguments?.params[0];
  const brandLiteral =
    brandParam?.type === AST_NODE_TYPES.TSLiteralType ? brandParam.literal : undefined;
  const brandText = brandLiteral?.type === AST_NODE_TYPES.Literal ? brandLiteral.value : undefined;

  if (typeof brandText !== 'string') {
    return;
  }

  const expectedBrandText = `#Gateway${typeName}`;

  if (brandText !== expectedBrandText) {
    context.report({
      node,
      messageId: 'wrongBrandText',
      data: { brandText, expectedBrandText },
    });
  }
};
