/**
 * PURPOSE: Layer helper that validates proxy constructors only create child proxies and setup mocks without side effects
 *
 * USAGE:
 * validateProxyConstructorSideEffectsLayerBroker({ functionNode, context });
 * // Reports error if proxy constructor has side effects like API calls, database operations, etc. before return
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { jestMockingStatics } from '../../../statics/jest-mocking/jest-mocking-statics';

export const validateProxyConstructorSideEffectsLayerBroker = ({
  functionNode,
  context,
}: {
  functionNode: Tsestree;
  context: EslintContext;
}): AdapterResult => {
  const result = adapterResultContract.parse({ success: true });
  const { body } = functionNode;

  if (!body) return result;

  if (Array.isArray(body)) return result;

  if (body.type !== 'BlockStatement') return result;

  if (!body.body || !Array.isArray(body.body)) return result;
  const statements = body.body;

  let returnStatementIndex = -1;
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (stmt && stmt.type === 'ReturnStatement') {
      returnStatementIndex = i;
      break;
    }
  }

  if (returnStatementIndex === -1) return result;

  // Check statements before return for side effects
  for (let i = 0; i < returnStatementIndex; i++) {
    const statement = statements[i];
    if (!statement) continue;

    // Check for ExpressionStatement containing side effects
    if (statement.type === 'ExpressionStatement') {
      const { expression } = statement;

      if (expression) {
        // Check for CallExpression
        if (expression.type === 'CallExpression') {
          const { callee } = expression;

          if (callee) {
            // Check for MemberExpression (obj.method())
            if (callee.type === 'MemberExpression') {
              const { object } = callee;

              // Check if it's calling a mock method (allowed)
              const { property } = callee;
              const propertyName = property?.name;
              const isLegacyMockMethod =
                propertyName !== undefined &&
                jestMockingStatics.mockMethods.some((method) => method === propertyName);

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
                object?.type === 'CallExpression' && object.callee?.type === 'MemberExpression'
                  ? object.callee.property?.name
                  : undefined;
              const isChainedResultCall =
                propertyName !== undefined &&
                jestMockingStatics.chainedMockResultMethodSet.has(propertyName) &&
                stagingAntecedentName !== undefined &&
                jestMockingStatics.chainedMockStagingMethodSet.has(stagingAntecedentName);

              const isMockMethod =
                isLegacyMockMethod || isBareChainedMockCall || isChainedResultCall;

              if (!isMockMethod) {
                const objectName = object?.name ?? 'unknown';

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
        }
      }
    }
  }
  return result;
};
