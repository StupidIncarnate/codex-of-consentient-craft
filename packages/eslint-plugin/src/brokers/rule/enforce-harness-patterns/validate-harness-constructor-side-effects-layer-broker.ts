/**
 * PURPOSE: Layer helper that validates harness constructors only perform allowed operations before returning
 *
 * USAGE:
 * validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context });
 * // Reports error if harness constructor has disallowed side effects before return statement
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { harnessLifecycleStatics } from '../../../statics/harness-lifecycle/harness-lifecycle-statics';
import { isAllowedHarnessMemberCallGuard } from '../../../guards/is-allowed-harness-member-call/is-allowed-harness-member-call-guard';

export const validateHarnessConstructorSideEffectsLayerBroker = ({
  functionNode,
  context,
}: {
  functionNode: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression;
  context: TSESLint.RuleContext<string, unknown[]>;
}): AdapterResult => {
  const result = adapterResultContract.parse({ success: true });
  const { body } = functionNode;

  if (body.type !== AST_NODE_TYPES.BlockStatement) return result;

  const statements = body.body;

  let returnStatementIndex = -1;
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (stmt && stmt.type === AST_NODE_TYPES.ReturnStatement) {
      returnStatementIndex = i;
      break;
    }
  }

  if (returnStatementIndex === -1) return result;

  for (let i = 0; i < returnStatementIndex; i++) {
    const statement = statements[i];
    if (!statement) continue;

    if (statement.type === AST_NODE_TYPES.VariableDeclaration) {
      for (const declarator of statement.declarations) {
        const initNode = declarator.init;
        if (!initNode) continue;

        if (initNode.type !== AST_NODE_TYPES.CallExpression) continue;

        const { callee: declCallee } = initNode;

        if (declCallee.type === AST_NODE_TYPES.Identifier) {
          const { name } = declCallee;

          const isLifecycleHook = harnessLifecycleStatics.allowedHookSet.has(name);
          const isChildHarness = name.endsWith('Harness');
          const isAllowed = isLifecycleHook || isChildHarness;

          if (!isAllowed) {
            context.report({
              node: statement,
              messageId: 'harnessConstructorNoSideEffects',
              data: { type: `${name}()` },
            });
          }
          continue;
        }

        if (declCallee.type === AST_NODE_TYPES.MemberExpression) {
          const { object, property } = declCallee;
          const objectName = 'name' in object ? object.name : undefined;
          const propertyName = 'name' in property ? property.name : undefined;
          if (!isAllowedHarnessMemberCallGuard({ objectName, propertyName })) {
            context.report({
              node: statement,
              messageId: 'harnessConstructorNoSideEffects',
              data: { type: `${objectName ?? 'unknown'}.${propertyName ?? 'method'}()` },
            });
          }
        }
      }
      continue;
    }

    if (statement.type !== AST_NODE_TYPES.ExpressionStatement) continue;

    const { expression } = statement;

    if (expression.type === AST_NODE_TYPES.AssignmentExpression) {
      context.report({
        node: statement,
        messageId: 'harnessConstructorNoSideEffects',
        data: { type: 'assignment expression' },
      });
      continue;
    }

    if (expression.type !== AST_NODE_TYPES.CallExpression) continue;

    const { callee } = expression;

    if (
      callee.type === AST_NODE_TYPES.ArrowFunctionExpression ||
      callee.type === AST_NODE_TYPES.FunctionExpression
    ) {
      context.report({
        node: statement,
        messageId: 'harnessConstructorNoSideEffects',
        data: { type: 'IIFE' },
      });
      continue;
    }

    if (callee.type === AST_NODE_TYPES.Identifier) {
      const { name } = callee;

      const isLifecycleHook = harnessLifecycleStatics.allowedHookSet.has(name);
      const isChildHarness = name.endsWith('Harness');
      const isAllowed = isLifecycleHook || isChildHarness;

      if (!isAllowed) {
        context.report({
          node: statement,
          messageId: 'harnessConstructorNoSideEffects',
          data: { type: `${name}()` },
        });
      }
      continue;
    }

    if (callee.type === AST_NODE_TYPES.MemberExpression) {
      const { object, property } = callee;
      const objectName = 'name' in object ? object.name : undefined;
      const propertyName = 'name' in property ? property.name : undefined;
      if (!isAllowedHarnessMemberCallGuard({ objectName, propertyName })) {
        context.report({
          node: statement,
          messageId: 'harnessConstructorNoSideEffects',
          data: { type: `${objectName ?? 'unknown'}.${propertyName ?? 'method'}()` },
        });
      }
    }
  }
  return result;
};
