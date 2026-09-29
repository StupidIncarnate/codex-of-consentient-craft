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
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';

export const ruleBanProxyCatchAllDefaultsBroker =
  (): TSESLint.RuleModule<'catchAllProxyDefault'> => ({
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
    defaultOptions: [],
    create: (context: TSESLint.RuleContext<string, unknown[]>) => {
      const ctx = context;
      const { filename } = ctx;

      if (!hasFileSuffixGuard({ filename, suffix: 'proxy' })) {
        return {};
      }

      let currentProxyFunction: TSESTree.Node | null = null;
      let foundReturnStatement = false;

      return {
        // Track when we enter a proxy function, the same selector enforce-proxy-patterns uses
        'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression':
          (node: TSESTree.ArrowFunctionExpression): void => {
            const ancestors = ctx.sourceCode.getAncestors(node);
            for (const ancestor of ancestors) {
              if (
                ancestor.type === AST_NODE_TYPES.VariableDeclarator &&
                ancestor.id.type === AST_NODE_TYPES.Identifier &&
                ancestor.id.name.endsWith('Proxy')
              ) {
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

        CallExpression: (node: TSESTree.CallExpression): void => {
          if (currentProxyFunction === null || foundReturnStatement) {
            return;
          }

          const { callee } = node;

          if (
            callee.type !== AST_NODE_TYPES.MemberExpression ||
            (callee.property.type === AST_NODE_TYPES.Identifier ||
            callee.property.type === AST_NODE_TYPES.PrivateIdentifier
              ? callee.property.name
              : undefined) !== 'calledWith'
          ) {
            return;
          }

          const [addressArgument] = node.arguments;

          if (addressArgument?.type !== AST_NODE_TYPES.ArrayExpression) {
            return;
          }

          const hasCatchAllElement = addressArgument.elements.some((element): boolean => {
            if (
              element === null ||
              (element.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
                element.type !== AST_NODE_TYPES.FunctionExpression)
            ) {
              return false;
            }

            const { body } = element;

            if (body.type !== AST_NODE_TYPES.BlockStatement) {
              return body.type === AST_NODE_TYPES.Literal && body.value === true;
            }

            const statements = Array.isArray(body.body) ? body.body : [];

            if (statements.length !== 1) {
              return false;
            }

            const [onlyStatement] = statements;

            return (
              onlyStatement?.type === AST_NODE_TYPES.ReturnStatement &&
              onlyStatement.argument?.type === AST_NODE_TYPES.Literal &&
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
