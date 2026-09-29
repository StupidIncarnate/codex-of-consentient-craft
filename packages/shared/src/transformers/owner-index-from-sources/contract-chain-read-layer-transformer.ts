/**
 * PURPOSE: Reads one zod expression down its call chain and reports what a field or contract is
 * built from: the brand text of its outermost `.brand<'Text'>()`, the `owner.shape.key` it reuses,
 * the identifier the chain starts at, and the object literal of a root `z.object(...)`.
 *
 * USAGE:
 * contractChainReadLayerTransformer({ node: initializer });
 * // Returns { brandText, shapeContractName, shapeKey, rootName, objectLiteral }, each undefined when absent
 */
import * as ts from '#gateway/npm/typescript';

import { identifierContract } from '../../contracts/identifier/identifier-contract';
import type { Identifier } from '../../contracts/identifier/identifier-contract';
import { ownerIndexStatics } from '../../statics/owner-index/owner-index-statics';

export const contractChainReadLayerTransformer = ({
  node,
}: {
  node: ts.Node;
}): {
  brandText: Identifier | undefined;
  shapeContractName: Identifier | undefined;
  shapeKey: Identifier | undefined;
  rootName: Identifier | undefined;
  objectLiteral: ts.Node | undefined;
} => {
  const empty = {
    brandText: undefined,
    shapeContractName: undefined,
    shapeKey: undefined,
    rootName: undefined,
    objectLiteral: undefined,
  };

  if (ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node)) {
    return contractChainReadLayerTransformer({ node: node.expression });
  }

  if (ts.isIdentifier(node)) {
    return { ...empty, rootName: identifierContract.parse(node.text) };
  }

  if (ts.isPropertyAccessExpression(node)) {
    const inner = node.expression;
    if (
      ts.isPropertyAccessExpression(inner) &&
      inner.name.text === 'shape' &&
      ts.isIdentifier(inner.expression)
    ) {
      return {
        ...empty,
        shapeContractName: identifierContract.parse(inner.expression.text),
        shapeKey: identifierContract.parse(node.name.text),
        rootName: identifierContract.parse(inner.expression.text),
      };
    }
    return contractChainReadLayerTransformer({ node: inner });
  }

  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
    const callee = node.expression;
    if (
      ts.isIdentifier(callee.expression) &&
      callee.expression.text === 'z' &&
      ownerIndexStatics.objectRootNames.some((name) => name === callee.name.text)
    ) {
      const [argument] = node.arguments;
      return {
        ...empty,
        rootName: identifierContract.parse('z'),
        objectLiteral:
          argument !== undefined && ts.isObjectLiteralExpression(argument) ? argument : undefined,
      };
    }

    const inner = contractChainReadLayerTransformer({ node: callee.expression });
    const [typeArgument] = node.typeArguments ?? [];
    const quotedText =
      callee.name.text === 'brand'
        ? /^['"](?<text>.+)['"]$/u.exec(typeArgument?.getText() ?? '')
        : null;
    const ownBrand =
      quotedText?.groups?.text === undefined
        ? undefined
        : identifierContract.parse(quotedText.groups.text);
    return { ...inner, brandText: ownBrand ?? inner.brandText };
  }

  return empty;
};
