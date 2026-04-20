/**
 * PURPOSE: Layer helper that validates harness constructors only perform allowed operations before returning
 *
 * USAGE:
 * validateHarnessConstructorSideEffectsLayerBroker({ functionNode, context });
 * // Reports error if harness constructor has disallowed side effects before return statement
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { harnessLifecycleStatics } from '../../../statics/harness-lifecycle/harness-lifecycle-statics';
import { isAllowedHarnessMemberCallGuard } from '../../../guards/is-allowed-harness-member-call/is-allowed-harness-member-call-guard';

export const validateHarnessConstructorSideEffectsLayerBroker = ({
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

  for (let i = 0; i < returnStatementIndex; i++) {
    const statement = statements[i];
    if (!statement) continue;

    if (statement.type === 'VariableDeclaration') {
      const declarators = statement.declarations;
      if (!declarators) continue;

      for (const declarator of declarators) {
        const initNode = declarator.init;
        if (!initNode) continue;

        if (initNode.type !== 'CallExpression') continue;

        const { callee: declCallee } = initNode;
        if (!declCallee) continue;

        if (declCallee.type === 'Identifier') {
          const { name } = declCallee;
          if (!name) continue;

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

        if (declCallee.type === 'MemberExpression') {
          const { object, property } = declCallee;
          if (
            !isAllowedHarnessMemberCallGuard({
              objectName: object?.name,
              propertyName: property?.name,
            })
          ) {
            const objectName = object?.name ?? 'unknown';
            context.report({
              node: statement,
              messageId: 'harnessConstructorNoSideEffects',
              data: { type: `${objectName}.${property?.name ?? 'method'}()` },
            });
          }
        }
      }
      continue;
    }

    if (statement.type !== 'ExpressionStatement') continue;

    const { expression } = statement;
    if (!expression) continue;

    if (expression.type === 'AssignmentExpression') {
      context.report({
        node: statement,
        messageId: 'harnessConstructorNoSideEffects',
        data: { type: 'assignment expression' },
      });
      continue;
    }

    if (expression.type !== 'CallExpression') continue;

    const { callee } = expression;
    if (!callee) continue;

    if (callee.type === 'ArrowFunctionExpression' || callee.type === 'FunctionExpression') {
      context.report({
        node: statement,
        messageId: 'harnessConstructorNoSideEffects',
        data: { type: 'IIFE' },
      });
      continue;
    }

    if (callee.type === 'Identifier') {
      const { name } = callee;
      if (!name) continue;

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

    if (callee.type === 'MemberExpression') {
      const { object, property } = callee;
      if (
        !isAllowedHarnessMemberCallGuard({ objectName: object?.name, propertyName: property?.name })
      ) {
        const objectName = object?.name ?? 'unknown';
        context.report({
          node: statement,
          messageId: 'harnessConstructorNoSideEffects',
          data: { type: `${objectName}.${property?.name ?? 'method'}()` },
        });
      }
    }
  }
  return result;
};
