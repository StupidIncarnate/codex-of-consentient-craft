/**
 * PURPOSE: Layer helper that validates proxy constructors only create child proxies and setup mocks without side effects
 *
 * USAGE:
 * validateProxyConstructorSideEffectsLayerBroker({ functionNode, context });
 * // Reports error if proxy constructor has side effects like API calls, database operations, etc. before return
 */
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { jestMockingStatics } from '../../../statics/jest-mocking/jest-mocking-statics';

export const validateProxyConstructorSideEffectsLayerBroker = ({
  functionNode,
  context,
}: {
  functionNode: Tsestree;
  context: EslintContext;
}): void => {
  const { body } = functionNode;

  if (!body) return;

  // Handle union type - body can be single node or array
  if (Array.isArray(body)) return;

  // Only check BlockStatement functions (not direct returns)
  if (body.type !== 'BlockStatement') return;

  if (!body.body || !Array.isArray(body.body)) return;
  const statements = body.body;

  // Find return statement position
  let returnStatementIndex = -1;
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (stmt && stmt.type === 'ReturnStatement') {
      returnStatementIndex = i;
      break;
    }
  }

  if (returnStatementIndex === -1) return;

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
              const isMockMethod =
                propertyName &&
                jestMockingStatics.mockMethods.some((method) => method === propertyName);

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
};
