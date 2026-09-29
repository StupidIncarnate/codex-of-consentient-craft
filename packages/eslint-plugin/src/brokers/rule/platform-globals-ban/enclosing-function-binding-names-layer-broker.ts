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
import { identifierContract, type Identifier } from '@dungeonmaster/shared/contracts';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const enclosingFunctionBindingNamesLayerBroker = ({
  node,
}: {
  node?: Tsestree | null | undefined;
}): Identifier[] => {
  if (node === null || node === undefined) {
    return [];
  }
  const outerNames = enclosingFunctionBindingNamesLayerBroker({ node: node.parent });
  const { parent } = node;

  if (node.type === 'FunctionDeclaration' && node.id?.name !== undefined) {
    return [identifierContract.parse(node.id.name), ...outerNames];
  }

  const isFunctionLiteral =
    node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression';
  if (
    isFunctionLiteral &&
    parent?.type === 'VariableDeclarator' &&
    parent.init === node &&
    parent.id?.type === 'Identifier' &&
    parent.id.name !== undefined
  ) {
    return [identifierContract.parse(parent.id.name), ...outerNames];
  }

  return outerNames;
};
