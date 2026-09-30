/**
 * PURPOSE: Lists the binding name of every named function enclosing a node, innermost first —
 * `const READ_FN = () => document.title` gives `READ_FN`, `function readFn() {}` gives `readFn`.
 * platform-globals-ban holds a report inside such a function until the whole file is walked, then
 * drops it when that name is passed as the first argument of a Playwright browser-side call
 * (`page.evaluate(READ_FN)`), because the function's source is shipped to the driven browser. An
 * anonymous function contributes no name.
 *
 * USAGE:
 * enclosingFunctionBindingNamesLayerBroker({ node: documentIdentifierInsideReadFn });
 * // Returns ['READ_FN'] as Identifier[]
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const enclosingFunctionBindingNamesLayerBroker = ({
  node,
}: {
  node?: TSESTree.Node | null | undefined;
}): string[] => {
  if (node === null || node === undefined) {
    return [];
  }
  const outerNames = enclosingFunctionBindingNamesLayerBroker({ node: node.parent });
  const { parent } = node;

  if (node.type === AST_NODE_TYPES.FunctionDeclaration && node.id?.name !== undefined) {
    return [node.id.name, ...outerNames];
  }

  const isFunctionLiteral =
    node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
    node.type === AST_NODE_TYPES.FunctionExpression;
  if (
    isFunctionLiteral &&
    parent?.type === AST_NODE_TYPES.VariableDeclarator &&
    parent.init === node &&
    parent.id.type === AST_NODE_TYPES.Identifier
  ) {
    return [parent.id.name, ...outerNames];
  }

  return outerNames;
};
