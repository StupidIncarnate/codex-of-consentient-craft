/**
 * PURPOSE: Layer helper that validates adapter proxies setup mock implementations in constructor
 *
 * USAGE:
 * validateAdapterMockSetupLayerBroker({ functionNode, context });
 * // Reports error if adapter proxy uses jest.mocked() but doesn't call mockImplementation/mockResolvedValue before return
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { jestMockingStatics } from '../../../statics/jest-mocking/jest-mocking-statics';

export const validateAdapterMockSetupLayerBroker = ({
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
    if (stmt?.type === AST_NODE_TYPES.ReturnStatement) {
      returnStatementIndex = i;
      break;
    }
  }

  if (returnStatementIndex === -1) return;

  // Check statements before return for jest mocking calls and mock setup calls
  let hasJestMocking = false;
  let hasMockSetup = false;

  for (let i = 0; i < returnStatementIndex; i++) {
    const statement = statements[i];
    if (!statement) continue;

    // Check for ExpressionStatement or VariableDeclaration
    if (statement.type === AST_NODE_TYPES.ExpressionStatement) {
      const { expression } = statement;

      // Check for MemberExpression callee (jest.spyOn, mock.mockImplementation)
      if (
        expression.type === AST_NODE_TYPES.CallExpression &&
        expression.callee.type === AST_NODE_TYPES.MemberExpression
      ) {
        const { object, property } = expression.callee;
        const objectName = 'name' in object ? object.name : undefined;
        const propertyName = 'name' in property ? property.name : undefined;

        // Check if calling jest.spyOn
        if (objectName === 'jest' && propertyName === 'spyOn') {
          hasJestMocking = true;
        }

        // Check if calling mockImplementation, mockResolvedValue, mockRejectedValue, mockReturnValue
        const isMockMethod =
          propertyName !== undefined &&
          jestMockingStatics.nativeJestMockMethods.some((method) => method === propertyName);

        if (isMockMethod) {
          hasMockSetup = true;
        }
      }
    } else if (statement.type === AST_NODE_TYPES.VariableDeclaration) {
      // Check for jest.mocked() or jest.spyOn() in variable declarations
      for (const declaration of statement.declarations) {
        const { init } = declaration;

        // Check for MemberExpression callee (jest.mocked, jest.spyOn)
        if (
          init?.type === AST_NODE_TYPES.CallExpression &&
          init.callee.type === AST_NODE_TYPES.MemberExpression
        ) {
          const { object, property } = init.callee;
          const objectName = 'name' in object ? object.name : undefined;
          const propertyName = 'name' in property ? property.name : undefined;

          // Check if calling jest.mocked or jest.spyOn
          if (objectName === 'jest' && (propertyName === 'mocked' || propertyName === 'spyOn')) {
            hasJestMocking = true;
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
};
