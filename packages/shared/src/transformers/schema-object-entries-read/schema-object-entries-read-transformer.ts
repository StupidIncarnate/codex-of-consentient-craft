/**
 * PURPOSE: Lists the keys of the `z.object({...})` at the root of a zod chain, with the source text
 * of each value, in written order. A getter key yields the expression its body returns. Reach for
 * this over the owner index's fields when the value text itself is compared, such as to decide that a
 * nested object copies a contract; a chain with no object literal root has no entries.
 *
 * USAGE:
 * schemaObjectEntriesReadTransformer({ text: "z.object({ id: z.string() }).brand<'Thing'>()" });
 * // Returns [{ key: 'id', valueText: 'z.string()' }]
 */
import * as ts from '#gateway/npm/typescript';

import { identifierContract } from '../../contracts/identifier/identifier-contract';
import { schemaObjectEntryContract } from '../../contracts/schema-object-entry/schema-object-entry-contract';
import type { SchemaObjectEntry } from '../../contracts/schema-object-entry/schema-object-entry-contract';
import { ownerIndexStatics } from '../../statics/owner-index/owner-index-statics';

export const schemaObjectEntriesReadTransformer = ({
  text,
}: {
  text: string;
}): SchemaObjectEntry[] => {
  const [statement] = ts.createSourceFile(
    'schema-entries.ts',
    `const chain = ${text};`,
    ts.ScriptTarget.Latest,
    true,
  ).statements;
  const node =
    statement !== undefined && ts.isVariableStatement(statement)
      ? statement.declarationList.declarations[0]?.initializer
      : undefined;
  if (node === undefined) {
    return [];
  }

  if (
    ts.isParenthesizedExpression(node) ||
    ts.isNonNullExpression(node) ||
    ts.isPropertyAccessExpression(node)
  ) {
    return schemaObjectEntriesReadTransformer({
      text: node.expression.getText(),
    });
  }

  if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) {
    return [];
  }

  const callee = node.expression;
  const isObjectRoot =
    ts.isIdentifier(callee.expression) &&
    callee.expression.text === 'z' &&
    ownerIndexStatics.objectRootNames.some((name) => name === callee.name.text);
  if (!isObjectRoot) {
    return schemaObjectEntriesReadTransformer({
      text: callee.expression.getText(),
    });
  }

  const [argument] = node.arguments;
  if (argument === undefined || !ts.isObjectLiteralExpression(argument)) {
    return [];
  }
  return argument.properties.flatMap((property): SchemaObjectEntry[] => {
    const keyNode = property.name;
    if (keyNode === undefined || !(ts.isIdentifier(keyNode) || ts.isStringLiteral(keyNode))) {
      return [];
    }
    const getterBody = ts.forEachChild(property, (child) =>
      ts.isBlock(child) ? child : undefined,
    );
    const valueNode = ts.isPropertyAssignment(property)
      ? property.initializer
      : property.kind === ts.SyntaxKind.GetAccessor
        ? getterBody?.statements.find(ts.isReturnStatement)?.expression
        : undefined;
    return valueNode === undefined
      ? []
      : [
          schemaObjectEntryContract.parse({
            key: identifierContract.parse(keyNode.text),
            valueText: valueNode.getText(),
          }),
        ];
  });
};
