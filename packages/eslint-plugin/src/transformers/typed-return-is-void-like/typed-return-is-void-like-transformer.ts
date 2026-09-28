/**
 * PURPOSE: Resolves a function-like declaration's own return type, or a call expression's result
 * type, through the TypeScript type checker and tells whether it can only ever hold one concrete
 * value — real `void`, `Promise<void>`, a literal (`true`), or an object type whose every property
 * is itself a literal (`{ success: true }`, R1's "void in disguise"). `enforce-folder-return-types`
 * needs this both for the function under lint (is its declared return void-like at all?) and for
 * each call it discards (did that call actually tell it something?), so one transformer answers both —
 * branching on `node.type` rather than taking a caller-supplied discriminator keeps every address
 * `check-folder-return-type-layer-broker` stages the same `{ context, node }` shape. Everything
 * stays inline in this one function — `forbid-non-exported-functions` bans a named helper, even a
 * nested one, so the literal/void check is repeated at each of its three call sites instead.
 *
 * USAGE:
 * typedReturnIsVoidLikeTransformer({ context, node: arrowFunctionExpressionNode });
 * // true for `(): void => {}` or `(): Promise<{ success: true }> => ...`; false for `(): boolean => true`
 * typedReturnIsVoidLikeTransformer({ context, node: callExpressionNode });
 * // true for a call resolving to `Promise<void>`; false for one resolving to `Promise<FileStat | null>`;
 * // undefined when the declaration node carries no call signature at all
 */
import { AST_NODE_TYPES, ESLintUtils } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import * as ts from '#gateway/npm/typescript';

export const typedReturnIsVoidLikeTransformer = ({
  context,
  node,
}: {
  context: unknown;
  node: unknown;
}): boolean | undefined => {
  const services = ESLintUtils.getParserServices(
    context as Readonly<TSESLint.RuleContext<never, never[]>>,
  );
  const checker = services.program.getTypeChecker();
  const tsestreeNode = node as TSESTree.Node;
  const isCallNode = tsestreeNode.type === AST_NODE_TYPES.CallExpression;
  const nodeType = services.getTypeAtLocation(tsestreeNode);
  const [firstSignature] = nodeType.getCallSignatures();

  if (!isCallNode && !firstSignature) {
    return undefined;
  }

  // The `?? nodeType` fallback is never actually reached when `!isCallNode` — the guard above
  // already returned for that case — but writing it this way lets TS prove `candidateType: ts.Type`
  // without a cast or a non-null assertion on `firstSignature`.
  const candidateType = isCallNode ? nodeType : (firstSignature?.getReturnType() ?? nodeType);

  const symbolName = candidateType.getSymbol()?.getName() ?? candidateType.aliasSymbol?.name;
  const resolvedType =
    symbolName === 'Promise'
      ? (checker.getTypeArguments(candidateType as ts.TypeReference)[0] ?? candidateType)
      : candidateType;

  // `no-bitwise` bans `&`, so a flag check reads as strict equality — true for every case this
  // transformer cares about, since `getTypeAtLocation`/`getReturnType` hand back a plain `void` or a
  // plain boolean-literal type with no other flag bits combined in.
  const resolvedIsLiteralOrVoid =
    resolvedType.flags === ts.TypeFlags.Void ||
    resolvedType.isLiteral() ||
    resolvedType.flags === ts.TypeFlags.BooleanLiteral;

  if (resolvedIsLiteralOrVoid) {
    return true;
  }

  // A single-member literal union with no real variance — TypeScript collapses most of these to
  // the member itself, so this branch only ever fires for the rare case the type system still
  // represents as a one-element union.
  if (resolvedType.isUnion() && resolvedType.types.length === 1) {
    const [onlyMember] = resolvedType.types;
    return (
      onlyMember !== undefined &&
      (onlyMember.flags === ts.TypeFlags.Void ||
        onlyMember.isLiteral() ||
        onlyMember.flags === ts.TypeFlags.BooleanLiteral)
    );
  }

  const properties = resolvedType.getProperties();

  if (properties.length === 0) {
    return false;
  }

  return properties.every((property) => {
    const propertyType = checker.getTypeOfSymbol(property);
    return (
      propertyType.flags === ts.TypeFlags.Void ||
      propertyType.isLiteral() ||
      propertyType.flags === ts.TypeFlags.BooleanLiteral
    );
  });
};
