/**
 * PURPOSE: Resolves a `registerMock({ fn })` handle's `fn` expression through the TypeScript type
 * checker and tells whether every call signature it exposes can be invoked with zero arguments —
 * the distinction `ban-proxy-empty-called-with` needs to tell an honest `calledWith([])` (a real
 * zero-arg function, `randomUUID`) apart from a catch-all `calledWith([])` (`readFileSync`, whose
 * first parameter is required), which AST shape alone cannot make.
 *
 * USAGE:
 * const takesNoArgs = typedFunctionTakesNoArgsTransformer({ context, node: fnExpressionNode });
 * // true when every call signature of `node`'s type accepts zero arguments (randomUUID);
 * // false when at least one signature requires an argument (readFileSync); undefined when the
 * // type carries no call signature at all (unresolved, or not callable) — the caller should not
 * // report a violation on undefined, only on false
 */
import { ESLintUtils } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import * as ts from '#gateway/npm/typescript';

export const typedFunctionTakesNoArgsTransformer = ({
  context,
  node,
}: {
  context: unknown;
  node: unknown;
}): boolean | undefined => {
  const services = ESLintUtils.getParserServices(
    context as Readonly<TSESLint.RuleContext<never, never[]>>,
  );
  const type = services.getTypeAtLocation(node as TSESTree.Node);
  const signatures = type.getCallSignatures();

  if (signatures.length === 0) {
    return undefined;
  }

  return signatures.some((signature) => {
    const [firstParameter] = signature.parameters;

    if (!firstParameter) {
      return true;
    }

    const declaration = firstParameter.valueDeclaration;

    return (
      declaration !== undefined &&
      ts.isParameter(declaration) &&
      (declaration.questionToken !== undefined ||
        declaration.dotDotDotToken !== undefined ||
        declaration.initializer !== undefined)
    );
  });
};
