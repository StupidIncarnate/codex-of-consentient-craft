import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { jestTestingStatics } from '../../../statics/jest-testing/jest-testing-statics';

export const ruleForbidTodoSkipBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Forbid .todo and .skip on all Jest test methods (test, it, describe). All tests must be complete and runnable.',
      },
      messages: {
        noTodoOrSkip:
          'Test files must not use {{method}}.{{suffix}}(). All tests must be complete and runnable. Remove .{{suffix}} and implement the test.',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    return {
      CallExpression: (node: Tsestree): void => {
        const isTestFile = isTestFileGuard({ filename: ctx.filename ?? '' });

        // Only check test files
        if (!isTestFile) {
          return;
        }

        // Check if this is a method call (e.g., test.todo, it.skip, describe.skip)
        const { callee } = node;

        const isMemberExpression =
          callee?.type === 'MemberExpression' &&
          callee.object?.name !== undefined &&
          callee.property?.name !== undefined;

        if (!isMemberExpression) {
          return;
        }

        const methodName = callee.object?.name ?? 'unknown';
        const suffixName = callee.property?.name ?? 'unknown';

        // Check if it's a Jest test method (test, it, describe)
        const isJestMethod = jestTestingStatics.methods.some((method) => method === methodName);
        if (!isJestMethod) {
          return;
        }

        // Check if it's using .todo or .skip
        const isForbiddenSuffix = jestTestingStatics.forbiddenSuffixes.some(
          (suffix) => suffix === suffixName,
        );
        if (!isForbiddenSuffix) {
          return;
        }

        ctx.report({
          node,
          messageId: 'noTodoOrSkip',
          data: {
            method: methodName,
            suffix: suffixName,
          },
        });
      },
    };
  },
});
