/**
 * PURPOSE: Says, for each member of a type literal or interface, whether it is a function (a method,
 * or a property typed by a function type, a call-signature-only literal, or a same-file alias of
 * one), the `length: number` member of an array-like, or data.
 *
 * USAGE:
 * typeMemberKindsLayerTransformer({ members: node.members, typeAliases, visitedNames: [] });
 * // Returns ['function', 'data', 'length', ...] in member order
 */
import * as ts from '#gateway/npm/typescript';

import type { Identifier } from '../../contracts/identifier/identifier-contract';
import { typeAliasResolveLayerTransformer } from './type-alias-resolve-layer-transformer';

export const typeMemberKindsLayerTransformer = ({
  members,
  typeAliases,
  visitedNames,
}: {
  members: readonly ts.Node[];
  typeAliases: readonly { name: Identifier; node: ts.Node }[];
  visitedNames: readonly Identifier[];
}): ('function' | 'length' | 'data')[] =>
  members.map((member) => {
    if (ts.isMethodSignature(member)) {
      return 'function';
    }
    if (!ts.isPropertySignature(member) || member.type === undefined) {
      return 'data';
    }
    const alias = typeAliasResolveLayerTransformer({
      typeNode: member.type,
      typeAliases,
      visitedNames,
    });
    const memberType = alias === undefined ? member.type : alias.node;
    if (ts.isFunctionTypeNode(memberType)) {
      return 'function';
    }
    if (
      ts.isTypeLiteralNode(memberType) &&
      memberType.members.length > 0 &&
      memberType.members.every((inner) => inner.kind === ts.SyntaxKind.CallSignature)
    ) {
      return 'function';
    }
    return ts.isIdentifier(member.name) &&
      member.name.text === 'length' &&
      member.type.kind === ts.SyntaxKind.NumberKeyword
      ? 'length'
      : 'data';
  });
