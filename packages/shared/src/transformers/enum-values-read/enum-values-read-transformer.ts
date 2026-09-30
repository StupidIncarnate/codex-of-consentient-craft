/**
 * PURPOSE: Reads the value list of a `z.enum([...])` written with an array literal of strings,
 * found anywhere down a zod call chain such as `z.enum([...]).brand<'X'>()`. Reach for this when the
 * question is which values an enum holds; a chain that is not a `z.enum` over literal strings has no
 * answer, so an enum built from a variable is never compared.
 *
 * USAGE:
 * enumValuesReadTransformer({ text: "z.enum(['b', 'a']).brand<'Kind'>()" });
 * // Returns ['a', 'b'] as ContentText[], sorted, or undefined when the chain is not a literal `z.enum`
 */
import * as ts from '#gateway/npm/typescript';

export const enumValuesReadTransformer = ({ text }: { text: string }): string[] | undefined => {
  const [statement] = ts.createSourceFile(
    'enum-values.ts',
    `const chain = ${text};`,
    ts.ScriptTarget.Latest,
    true,
  ).statements;
  const node =
    statement !== undefined && ts.isVariableStatement(statement)
      ? statement.declarationList.declarations[0]?.initializer
      : undefined;
  if (node === undefined) {
    return undefined;
  }

  if (ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node)) {
    return enumValuesReadTransformer({
      text: node.expression.getText(),
    });
  }

  if (ts.isPropertyAccessExpression(node)) {
    return enumValuesReadTransformer({
      text: node.expression.getText(),
    });
  }

  if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) {
    return undefined;
  }

  const callee = node.expression;
  if (!(
    ts.isIdentifier(callee.expression) &&
    callee.expression.text === 'z' &&
    callee.name.text === 'enum'
  )) {
    return enumValuesReadTransformer({
      text: callee.expression.getText(),
    });
  }

  const [argument] = node.arguments;
  if (argument === undefined || !ts.isArrayLiteralExpression(argument)) {
    return undefined;
  }
  const literals = argument.elements.flatMap((element) =>
    ts.isStringLiteral(element) ? [element.text] : [],
  );
  return literals.length === argument.elements.length
    ? literals.sort((left, right) => left.localeCompare(right)).map((value) => value)
    : undefined;
};
