/**
 * PURPOSE: Resolves a type-position identifier through the TypeScript type checker and tells
 * whether it names a function's OWN generic type parameter, versus a real declared type
 * (an interface, a type alias, a class) — the distinction AST shape alone cannot make, since a
 * cast to `T` and a cast to `Settings` are both a bare `TSTypeReference` over an `Identifier`.
 * `gateway-return-unknown-not-caller-type` uses this to refuse a cast or a return type that names
 * a type parameter (the caller's own invented type) while leaving a cast to a real type alone.
 *
 * USAGE:
 * const typeParameterName = typedTypeParameterNameTransformer({ context, node });
 * // node is the Identifier in `JSON.parse(text) as T` — returns 'T' when `T` resolves to that
 * // function's own `<T>` declaration, undefined when it resolves to an interface, a type alias,
 * // a class, or nothing at all
 */
import { ESLintUtils } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import * as ts from '#gateway/npm/typescript';
import { identifierContract, type Identifier } from '@dungeonmaster/shared/contracts';

export const typedTypeParameterNameTransformer = ({
  context,
  node,
}: {
  context: unknown;
  node: unknown;
}): Identifier | undefined => {
  const services = ESLintUtils.getParserServices(
    context as Readonly<TSESLint.RuleContext<never, never[]>>,
  );
  const symbol = services.getSymbolAtLocation(node as TSESTree.Node);
  const declaration = symbol?.getDeclarations()?.[0];

  return declaration !== undefined && ts.isTypeParameterDeclaration(declaration)
    ? identifierContract.parse(declaration.name.text)
    : undefined;
};
