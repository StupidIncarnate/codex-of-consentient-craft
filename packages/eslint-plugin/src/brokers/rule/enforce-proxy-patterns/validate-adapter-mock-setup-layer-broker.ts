/**
 * PURPOSE: Layer helper that validates adapter proxies setup mock implementations in constructor
 *
 * USAGE:
 * validateAdapterMockSetupLayerBroker({ functionNode, context });
 * // Reports error if adapter proxy uses jest.mocked() but doesn't call mockImplementation/mockResolvedValue before return
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { jestMockingStatics } from '../../../statics/jest-mocking/jest-mocking-statics';

export const validateAdapterMockSetupLayerBroker = ({
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

  // Check statements before return for jest mocking calls and mock setup calls
  let hasJestMocking = false;
  let hasMockSetup = false;

  for (let i = 0; i < returnStatementIndex; i++) {
    const statement = statements[i];
    if (!statement) continue;

    // Check for ExpressionStatement or VariableDeclaration
    if (statement.type === 'ExpressionStatement') {
      const { expression } = statement;

      if (expression) {
        // Check for CallExpression
        if (expression.type === 'CallExpression') {
          const { callee } = expression;

          if (callee) {
            // Check for MemberExpression (jest.spyOn, mock.mockImplementation)
            if (callee.type === 'MemberExpression') {
              const { object } = callee;
              const { property } = callee;

              // Check if calling jest.spyOn
              if (object?.name === 'jest' && property?.name === 'spyOn') {
                hasJestMocking = true;
              }

              // Check if calling mockImplementation, mockResolvedValue, mockRejectedValue, mockReturnValue
              const isMockMethod =
                property?.name &&
                jestMockingStatics.mockMethods.some((method) => method === property.name);

              if (isMockMethod) {
                hasMockSetup = true;
              }
            }
          }
        }
      }
    } else if (statement.type === 'VariableDeclaration') {
      // Check for jest.mocked() or jest.spyOn() in variable declarations
      const { declarations } = statement;

      if (declarations) {
        for (const declaration of declarations) {
          if (declaration.type === 'VariableDeclarator') {
            const { init } = declaration;

            if (init) {
              // Check for CallExpression (jest.mocked(), jest.spyOn())
              if (init.type === 'CallExpression') {
                const { callee } = init;

                if (callee) {
                  // Check for MemberExpression (jest.mocked, jest.spyOn)
                  if (callee.type === 'MemberExpression') {
                    const { object } = callee;
                    const { property } = callee;

                    // Check if calling jest.mocked or jest.spyOn
                    if (
                      object?.name === 'jest' &&
                      (property?.name === 'mocked' || property?.name === 'spyOn')
                    ) {
                      hasJestMocking = true;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  if (hasJestMocking && !hasMockSetup) {
    context.report({
      node: functionNode,
      messageId: 'adapterProxyMustSetupMocks',
    });
  }
  return result;
};
