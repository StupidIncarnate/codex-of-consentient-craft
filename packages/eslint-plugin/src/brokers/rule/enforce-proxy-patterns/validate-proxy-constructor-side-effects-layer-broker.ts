/**
 * PURPOSE: Layer helper that validates proxy constructors only create child proxies and setup mocks without side effects
 *
 * USAGE:
 * validateProxyConstructorSideEffectsLayerBroker({ functionNode, context });
 * // Reports error if proxy constructor has side effects like API calls, database operations, etc. before return
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { jestMockingStatics } from '../../../statics/jest-mocking/jest-mocking-statics';

export const validateProxyConstructorSideEffectsLayerBroker = ({
  functionNode,
  context,
}: {
  functionNode: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression;
  context: TSESLint.RuleContext<string, unknown[]>;
}): void => {
  const { body } = functionNode;

  if (body.type !== AST_NODE_TYPES.BlockStatement) return;

  const statements = body.body;

  let returnStatementIndex = -1;
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (stmt && stmt.type === AST_NODE_TYPES.ReturnStatement) {
      returnStatementIndex = i;
      break;
    }
  }

  if (returnStatementIndex === -1) return;

  // Check statements before return for side effects
  for (let i = 0; i < returnStatementIndex; i++) {
    const statement = statements[i];
    if (!statement) continue;

    // Check for a CallExpression statement containing side effects
    if (
      statement.type === AST_NODE_TYPES.ExpressionStatement &&
      statement.expression.type === AST_NODE_TYPES.CallExpression &&
      statement.expression.callee.type === AST_NODE_TYPES.MemberExpression
    ) {
      // Check for MemberExpression (obj.method())
      const { object, property } = statement.expression.callee;

      // Check if it's calling a mock method (allowed)
      const propertyName = 'name' in property ? property.name : undefined;
      const isNativeJestMockMethod =
        propertyName !== undefined &&
        jestMockingStatics.nativeJestMockMethods.some((method) => method === propertyName);

      // Bare argument-addressed staging/query call: handle.calledWith([args]),
      // handle.onceFor([args]), handle.callsMatching([args]) — allowed on their own.
      const isBareChainedMockCall =
        propertyName !== undefined &&
        (jestMockingStatics.chainedMockStagingMethodSet.has(propertyName) ||
          jestMockingStatics.chainedMockQueryMethodSet.has(propertyName));

      // Chained result call: handle.calledWith([args]).resolves(value) — the outer
      // callee's object is itself a CallExpression whose own callee is a staging method
      // (calledWith/onceFor). Only counts as mock setup when the chain actually bottoms
      // out there; a call like foo.query().returns(1) does not qualify.
      const stagingAntecedentName =
        object.type === AST_NODE_TYPES.CallExpression &&
        object.callee.type === AST_NODE_TYPES.MemberExpression &&
        'name' in object.callee.property
          ? object.callee.property.name
          : undefined;
      const isChainedResultCall =
        propertyName !== undefined &&
        jestMockingStatics.chainedMockResultMethodSet.has(propertyName) &&
        stagingAntecedentName !== undefined &&
        jestMockingStatics.chainedMockStagingMethodSet.has(stagingAntecedentName);

      const isMockMethod = isNativeJestMockMethod || isBareChainedMockCall || isChainedResultCall;

      if (!isMockMethod) {
        const objectName = 'name' in object ? object.name : 'unknown';

        // Check if this is an allowed operation (jest or child proxy)
        const isJestOperation = objectName === 'jest';
        const isChildProxyCreation = objectName.endsWith('Proxy');
        const isAllowed = isJestOperation || isChildProxyCreation;

        // Everything else is a side effect
        if (!isAllowed) {
          context.report({
            node: statement,
            messageId: 'proxyConstructorNoSideEffects',
            data: { type: `${objectName}.${propertyName ?? 'method'}()` },
          });
        }
      }
    }
  }
};
