/**
 * PURPOSE: Reports a `return` whose argument is (directly, or through one local `const`) a
 * `JSON.parse(...)` call or an `import(...)` expression, inside a function with NO declared
 * return type — the one case an explicit return type (even `unknown`) does not already guard,
 * since TypeScript happily infers `any`/`Promise<any>` there and lets it leave unchecked. Only the
 * immediate enclosing block's own `const` declarations are searched; this is a gateway wrapper
 * function's own small body, not a general dataflow analysis.
 *
 * USAGE:
 * checkAnyLeakReturnLayerBroker({ node: returnStatementNode, context });
 * // Reports 'anyLeakNoReturnType' for `const data = JSON.parse(text); return data;` when the
 * // enclosing function declares no return type
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { findEnclosingFunctionLayerBroker } from './find-enclosing-function-layer-broker';
import { isJsonParseOrDynamicImportCallLayerBroker } from './is-json-parse-or-dynamic-import-call-layer-broker';

export const checkAnyLeakReturnLayerBroker = ({
  node,
  context,
}: {
  node: TSESTree.ReturnStatement;
  context: TSESLint.RuleContext<string, unknown[]>;
}): void => {
  const enclosingFunction = findEnclosingFunctionLayerBroker({ node: node.parent });

  if (
    !enclosingFunction ||
    ('returnType' in enclosingFunction ? enclosingFunction.returnType : undefined)
  ) {
    return;
  }

  const { argument } = node;

  if (isJsonParseOrDynamicImportCallLayerBroker({ node: argument })) {
    context.report({ node, messageId: 'anyLeakNoReturnType' });
    return;
  }

  if (argument?.type !== AST_NODE_TYPES.Identifier) {
    return;
  }

  const targetName = argument.name;
  const parentNode = node.parent;
  const blockStatements = Array.isArray('body' in parentNode ? parentNode.body : undefined)
    ? 'body' in parentNode
      ? parentNode.body
      : undefined
    : [];

  const hasRiskyDeclarator =
    blockStatements && 'some' in blockStatements
      ? blockStatements.some(
          (statement) =>
            statement.type === AST_NODE_TYPES.VariableDeclaration &&
            statement.declarations.some(
              (declarator) =>
                declarator.id.type === AST_NODE_TYPES.Identifier &&
                declarator.id.name === targetName &&
                isJsonParseOrDynamicImportCallLayerBroker({ node: declarator.init }),
            ),
        )
      : undefined;

  if (hasRiskyDeclarator) {
    context.report({ node, messageId: 'anyLeakNoReturnType' });
  }
};
