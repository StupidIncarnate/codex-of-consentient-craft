/**
 * PURPOSE: Refuses a hand-made `new Error(...)` given — directly, nested in an object literal, or
 * wrapped in `Object.assign(...)` — to a mock's `rejects`, `throws`, or a throwing `implement`, in a
 * proxy or test file. A hand-made error has the shape its author imagined, not the shape Node
 * actually produces (no `code`, no `syscall`, no `errno`); the fix is the matching recorded-failure
 * stub or wrapper-proxy scenario, never another hand-written `Error`.
 *
 * USAGE:
 * const rule = ruleBanInventedFailuresBroker();
 * // Flags `handle.calledWith([p]).throws(new Error('ENOENT'))` in a .proxy.ts or a .test.ts;
 * // leaves `handle.calledWith([p]).rejects(FileMissingErrorStub({...}))`, and a real
 * // `expect(() => run()).toThrow(...)` assertion, alone
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';

export const ruleBanInventedFailuresBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          "Ban a hand-made new Error(...) given to a mock's rejects, throws, or a throwing implement.",
      },
      messages: {
        inventedFailure:
          'This hand-made new Error(...) invents a shape Node never produces. Use the matching recorded-failure stub, or a wrapper-proxy scenario built on one, instead of authoring the error inline.',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = String(ctx.filename ?? '');

    if (!hasFileSuffixGuard({ filename, suffix: 'proxy' }) && !isTestFileGuard({ filename })) {
      return {};
    }

    return {
      NewExpression: (node: Tsestree): void => {
        const { callee } = node;

        if (callee?.type !== 'Identifier' || callee.name !== 'Error') {
          return;
        }

        const ancestors = ctx.sourceCode?.getAncestors(node) ?? [];
        const isFedToAnInventedFailureCall = ancestors.some((ancestor): boolean => {
          if (ancestor.type !== 'CallExpression' || ancestor.callee?.type !== 'MemberExpression') {
            return false;
          }

          const methodName = ancestor.callee.property?.name;

          return methodName === 'rejects' || methodName === 'throws' || methodName === 'implement';
        });

        if (isFedToAnInventedFailureCall) {
          ctx.report({ node, messageId: 'inventedFailure' });
        }
      },
    };
  },
});
