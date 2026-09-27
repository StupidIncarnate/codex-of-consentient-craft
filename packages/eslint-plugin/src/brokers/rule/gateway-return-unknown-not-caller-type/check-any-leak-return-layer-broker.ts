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
import { adapterResultContract, type AdapterResult } from '@dungeonmaster/shared/contracts';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import { findEnclosingFunctionLayerBroker } from './find-enclosing-function-layer-broker';
import { isJsonParseOrDynamicImportCallLayerBroker } from './is-json-parse-or-dynamic-import-call-layer-broker';

export const checkAnyLeakReturnLayerBroker = ({
  node,
  context,
}: {
  node: Tsestree;
  context: EslintContext;
}): AdapterResult => {
  const result = adapterResultContract.parse({ success: true });
  const enclosingFunction = findEnclosingFunctionLayerBroker({ node: node.parent });

  if (!enclosingFunction || enclosingFunction.returnType) {
    return result;
  }

  const { argument } = node;

  if (isJsonParseOrDynamicImportCallLayerBroker({ node: argument })) {
    context.report({ node, messageId: 'anyLeakNoReturnType' });
    return result;
  }

  if (argument?.type !== 'Identifier' || argument.name === undefined) {
    return result;
  }

  const targetName = String(argument.name);
  const parentNode = node.parent;
  const blockStatements = parentNode && Array.isArray(parentNode.body) ? parentNode.body : [];

  const hasRiskyDeclarator = blockStatements.some(
    (statement) =>
      statement.type === 'VariableDeclaration' &&
      (statement.declarations ?? []).some(
        (declarator) =>
          declarator.id?.type === 'Identifier' &&
          declarator.id.name === targetName &&
          isJsonParseOrDynamicImportCallLayerBroker({ node: declarator.init }),
      ),
  );

  if (hasRiskyDeclarator) {
    context.report({ node, messageId: 'anyLeakNoReturnType' });
  }

  return result;
};
