/**
 * PURPOSE: Refuses a `calledWith` matcher, staged in a proxy's constructor (before its return
 * statement), whose address array holds a function literal that returns `true` unconditionally —
 * a catch-all that answers every unaddressed call instead of letting the I/O trap catch a forgotten
 * one. The same literal written inside a RETURNED scenario method (an opt-in a test chooses to call)
 * is left alone; only a default the constructor stages for every test is refused.
 *
 * USAGE:
 * const rule = ruleBanProxyCatchAllDefaultsBroker();
 * // Flags `mock.calledWith([() => true]).returns('')` staged before a proxy's return statement;
 * // leaves `mock.calledWith([filePath]).returns(content)`, and the same literal inside a returned
 * // opt-in scenario method, alone
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';

export const ruleBanProxyCatchAllDefaultsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          "Ban a calledWith matcher, staged in a proxy's constructor, that accepts every argument unconditionally.",
      },
      messages: {
        catchAllProxyDefault:
          'This calledWith matcher returns true for any argument, so as a constructor default it answers every unaddressed call instead of letting the trap catch it. Stage the call by its real arguments — a literal, a variable, or a predicate that inspects them — or move this scenario into a returned opt-in method.',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = ctx.filename ?? '';

    if (!hasFileSuffixGuard({ filename: String(filename), suffix: 'proxy' })) {
      return {};
    }

    let currentProxyFunction: Tsestree | null = null;
    let foundReturnStatement = false;

    return {
      // Track when we enter a proxy function, the same selector enforce-proxy-patterns uses
      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression':
        (node: Tsestree): void => {
          const ancestors = ctx.sourceCode?.getAncestors(node) ?? [];
          for (const ancestor of ancestors) {
            if (ancestor.type === 'VariableDeclarator' && ancestor.id?.name?.endsWith('Proxy')) {
              currentProxyFunction = node;
              foundReturnStatement = false;
              break;
            }
          }
        },

      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression:exit':
        (): void => {
          currentProxyFunction = null;
          foundReturnStatement = false;
        },

      // ESLint visits a ReturnStatement before descending into its own argument, so an address
      // written inside a returned scenario method already reads foundReturnStatement === true.
      ReturnStatement: (): void => {
        if (currentProxyFunction !== null) {
          foundReturnStatement = true;
        }
      },

      CallExpression: (node: Tsestree): void => {
        if (currentProxyFunction === null || foundReturnStatement) {
          return;
        }

        const { callee } = node;

        if (callee?.type !== 'MemberExpression' || callee.property?.name !== 'calledWith') {
          return;
        }

        const [addressArgument] = node.arguments ?? [];

        if (addressArgument?.type !== 'ArrayExpression') {
          return;
        }

        const hasCatchAllElement = (addressArgument.elements ?? []).some((element): boolean => {
          if (
            element === null ||
            (element.type !== 'ArrowFunctionExpression' && element.type !== 'FunctionExpression')
          ) {
            return false;
          }

          const { body } = element;

          if (!body || Array.isArray(body)) {
            return false;
          }

          if (body.type !== 'BlockStatement') {
            return body.type === 'Literal' && body.value === true;
          }

          const statements = Array.isArray(body.body) ? body.body : [];

          if (statements.length !== 1) {
            return false;
          }

          const [onlyStatement] = statements;

          return (
            onlyStatement?.type === 'ReturnStatement' &&
            onlyStatement.argument?.type === 'Literal' &&
            onlyStatement.argument.value === true
          );
        });

        if (hasCatchAllElement) {
          ctx.report({ node, messageId: 'catchAllProxyDefault' });
        }
      },
    };
  },
});
