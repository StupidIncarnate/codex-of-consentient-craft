/**
 * PURPOSE: Resolves the method a `registerSpyOn({ object, method })` handle spies on through the
 * TypeScript type checker — the `method` property of `object`'s type — and tells whether every
 * call signature it exposes can be invoked with zero arguments. The spy twin of
 * typedFunctionTakesNoArgsTransformer, which reads a bare function expression: a spy names its
 * target as an object plus a method-name string, so no single expression carries the method's type.
 *
 * USAGE:
 * const takesNoArgs = typedSpyMethodTakesNoArgsLayerBroker({ context, objectNode, method: 'write' });
 * // false for process.stderr.write (first parameter required), true for Date.now, undefined when
 * // the object has no such property or it carries no call signature (a getter, a plain value)
 */
import { ESLintUtils } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import * as ts from '#gateway/npm/typescript';

export const typedSpyMethodTakesNoArgsLayerBroker = ({
  context,
  objectNode,
  method,
}: {
  context: unknown;
  objectNode: unknown;
  method: string;
}): boolean | undefined => {
  const services = ESLintUtils.getParserServices(
    context as Readonly<TSESLint.RuleContext<never, never[]>>,
  );
  const node = objectNode as TSESTree.Node;
  const property = services.getTypeAtLocation(node).getProperty(method);

  if (property === undefined) {
    return undefined;
  }

  const signatures = services.program
    .getTypeChecker()
    .getTypeOfSymbolAtLocation(property, services.esTreeNodeToTSNodeMap.get(node))
    .getCallSignatures();

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
